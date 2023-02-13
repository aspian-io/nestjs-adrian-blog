import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingsService } from 'src/settings/settings.service';
import { Between, FindOptionsWhere, In, IsNull, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';
import * as sanitizeHtml from 'sanitize-html';
import { SettingsKeyEnum } from 'src/settings/types/settings-key.enum';
import { ICommentSanitizerResult } from './types/service.type';
import { I18nContext } from 'nestjs-i18n';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { CommentsInfoLocale } from 'src/i18n/locale-keys/comments/info.locale';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { Cache } from 'cache-manager';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { User } from 'src/users/entities/user.entity';
import { CommentQueryListDto } from './dto/comment-query-list.dto';
import { FilterPaginationUtil, IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { PostsService } from 'src/posts/posts.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PostTypeEnum } from 'src/posts/entities/post.entity';

@Injectable()
export class CommentsService {
  constructor (
    @InjectRepository( Comment ) private readonly commentRepository: Repository<Comment>,
    @Inject( CACHE_MANAGER ) private readonly cacheManager: Cache,
    private readonly postsService: PostsService,
    private readonly settingsService: SettingsService,
    private readonly configService: ConfigService
  ) { }

  // Create a new comment
  async create (
    createCommentDto: CreateCommentDto,
    i18n: I18nContext,
    metadata: IMetadataDecorator ): Promise<Comment> {

    const {
      sanitizedTitle,
      sanitizedContent,
      isApproved
    } = await this.commentSanitizer( createCommentDto.title, createCommentDto.content );

    const isAdmin = metadata.user.claims.some( c => c.name === PermissionsEnum.ADMIN || c.name === PermissionsEnum.COMMENT_CREATE );

    const post = await this.postsService.findOne( createCommentDto.postId, i18n );

    const parentComment = createCommentDto?.parentId
      ? await this.findOne( createCommentDto.parentId, i18n )
      : null;

    let ancestor: Comment | null = null;
    if ( parentComment && parentComment.ancestor ) ancestor = parentComment.ancestor;
    if ( parentComment && !parentComment.ancestor ) ancestor = parentComment;

    const comment = this.commentRepository.create( {
      title: sanitizedTitle,
      content: sanitizedContent,
      ancestor,
      parent: parentComment,
      isApproved: isAdmin ? true : isApproved,
      post,
      seen: isAdmin,
      createdBy: { id: metadata.user.id },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    } );

    const result = await this.commentRepository.save( comment );
    await this.postsService.increasePostCommentsNum( post );
    await this.cacheManager.reset();

    return result;
  }

  // Find all comments
  async findAll ( query: CommentQueryListDto, postId?: string, onlyApproved: boolean = false, onlyAncestors = false ): Promise<IListResultGenerator<Comment>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    // TypeORM where object
    const where: FindOptionsWhere<Comment> | FindOptionsWhere<Comment>[] = {
      title: query[ 'searchBy.title' ],
      content: query[ 'searchBy.content' ],
      ancestor: query[ 'filterBy.onlyAncestors' ] ? IsNull() : undefined,
      createdAt: query[ 'filterBy.createdAt' ]?.length
        ? Between( query[ 'filterBy.createdAt' ][ 0 ], query[ 'filterBy.createdAt' ][ 1 ] )
        : undefined,
      updatedAt: query[ 'filterBy.updatedAt' ]?.length
        ? Between( query[ 'filterBy.updatedAt' ][ 0 ], query[ 'filterBy.updatedAt' ][ 1 ] )
        : undefined,
    };

    // Add Post Id filter
    if ( postId ) {
      where.post = { id: postId };
    }
    // Add post title filter
    if ( query[ 'filterBy.postTitle' ] ) {
      where.post = {
        title: query[ 'filterBy.postTitle' ]
      };
    }
    // Add isApproved filter
    if ( !onlyApproved ) {
      where.isApproved = query[ 'filterBy.isApproved' ];
    }

    if ( onlyAncestors ) {
      where.ancestor = IsNull();
    }

    where.seen = query[ 'filterBy.seen' ];
    // Only approved comments
    if ( onlyApproved ) where.isApproved = true;

    // Add likes number filter
    if ( query[ 'filterBy.likesNumGte' ] ) {
      where.likesNum = MoreThanOrEqual( query[ 'filterBy.likesNumGte' ] );
    }
    // Add dislikes number filter
    if ( query[ 'filterBy.dislikesNumGte' ] ) {
      where.likesNum = MoreThanOrEqual( query[ 'filterBy.dislikesNumGte' ] );
    }
    // Add createdBy filter
    if ( query[ 'filterBy.createdBy' ] ) {
      where.createdBy = [
        { email: In( query[ 'filterBy.createdBy' ] ) },
        { mobilePhone: In( query[ 'filterBy.createdBy' ] ) }
      ];
    }
    // Add updatedBy filter
    if ( query[ 'filterBy.updatedBy' ] ) {
      where.updatedBy = [
        { email: In( query[ 'filterBy.updatedBy' ] ) },
        { mobilePhone: In( query[ 'filterBy.updatedBy' ] ) }
      ];
    }

    // Get the result from database
    const [ items, totalItems ] = await this.commentRepository.findAndCount( {
      loadRelationIds: {
        relations: [ 'ancestor', 'parent', 'ancestorChildren', 'likes', 'dislikes' ]
      },
      relations: {
        post: true,
        createdBy: true,
        updatedBy: true
      },
      select: {
        post: { id: true, title: true, subtitle: true, slug: true },
        createdBy: { id: true, firstName: true, lastName: true, avatar: true, avatarSource: true, role: true },
        updatedBy: { id: true, firstName: true, lastName: true, avatar: true, avatarSource: true, role: true },
      },
      where,
      order: {
        title: query[ 'orderBy.title' ],
        content: query[ 'orderBy.content' ],
        isApproved: query[ 'orderBy.isApproved' ],
        isSpecial: query[ 'orderBy.isSpecial' ],
        likesNum: query[ 'orderBy.likesNum' ],
        dislikesNum: query[ 'orderBy.dislikesNum' ],
        seen: query[ 'orderBy.seen' ],
        createdAt: query[ 'orderBy.createdAt' ],
        updatedAt: query[ 'orderBy.updatedAt' ],
        ipAddress: query[ 'orderBy.ipAddress' ],
        userAgent: query[ 'orderBy.userAgent' ]
      },
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  // Find all replies of a specific comment
  async findAllCommentReplies (
    query: PaginationDto,
    ancestorId: string,
  ): Promise<IListResultGenerator<Comment>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    // Get the result from database
    const [ items, totalItems ] = await this.commentRepository.findAndCount( {
      loadRelationIds: {
        relations: [ 'ancestor' ]
      },
      relations: {
        parent: true,
        post: true,
        createdBy: true,
        updatedBy: true
      },
      select: {
        post: { title: true, subtitle: true, slug: true },
        createdBy: { id: true, firstName: true, lastName: true, avatar: true, avatarSource: true, role: true },
        updatedBy: { id: true, firstName: true, lastName: true, avatar: true, avatarSource: true, role: true },
      },
      where: {
        ancestor: {
          id: ancestorId
        }
      },
      order: {
        likesNum: {
          direction: 'DESC'
        },
        createdAt: {
          direction: 'ASC'
        }
      },
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  // Find all replies of a specific comment
  findAllCommentRepliesByParentId (
    parentId: string,
    metadata: IMetadataDecorator
  ): Promise<Comment[]> {

    // Get the result from database
    return this.commentRepository.find( {
      loadRelationIds: {
        relations: [ 'ancestor' ]
      },
      relations: {
        parent: true,
        post: true,
        createdBy: true,
        updatedBy: true
      },
      select: {
        post: { title: true, subtitle: true, slug: true },
        createdBy: { id: true, firstName: true, lastName: true, avatar: true, avatarSource: true, role: true },
        updatedBy: { id: true, firstName: true, lastName: true, avatar: true, avatarSource: true, role: true },
      },
      where: {
        parent: {
          id: parentId
        },
        createdBy: {
          id: metadata.user.id
        }
      },
      order: {
        createdAt: {
          direction: 'ASC'
        }
      },
    } );
  }

  // Find all project's special comments
  async findAllProjectsSpecialComments (): Promise<Comment[]> {
    return this.commentRepository.find( {
      relations: {
        createdBy: true,
        updatedBy: true,
        post: true
      },
      where: {
        post: {
          type: PostTypeEnum.PROJECT,
        },
        isApproved: true,
        isSpecial: true
      },
      order: {
        createdAt: {
          direction: 'DESC'
        }
      }
    } );
  }

  // Count Unseen Comments
  async countUnseen (): Promise<{ unseenNum: number; }> {
    const unseenNum = await this.commentRepository.count( { where: { seen: false } } );
    return { unseenNum };
  }

  // Find a comment
  async findOne ( id: string, i18n: I18nContext, withDeleted: boolean = false ): Promise<Comment> {
    const comment = await this.commentRepository.findOne( {
      where: { id },
      relations: {
        post: true,
        ancestor: { createdBy: true, updatedBy: true },
        parent: { createdBy: true, updatedBy: true },
        createdBy: true,
        updatedBy: true,
      },
      select: {
        post: { id: true, title: true, subtitle: true, slug: true },
        createdBy: { id: true, email: true, firstName: true, lastName: true, avatar: true, avatarSource: true, role: true },
        updatedBy: { id: true, email: true, firstName: true, lastName: true, avatar: true, avatarSource: true, role: true },
        ancestor: {
          id: true,
          title: true,
          content: true,
          post: { title: true, subtitle: true, slug: true },
          createdBy: { id: true, email: true, firstName: true, lastName: true, avatar: true, avatarSource: true, role: true },
          createdAt: true,
          likesNum: true,
          dislikesNum: true,
          updatedBy: { id: true, email: true, firstName: true, lastName: true, avatar: true, avatarSource: true, role: true },
          updatedAt: true
        },
        parent: {
          id: true,
          title: true,
          content: true,
          post: { title: true, subtitle: true, slug: true },
          createdBy: { id: true, email: true, firstName: true, lastName: true, avatar: true, avatarSource: true, role: true },
          createdAt: true,
          likesNum: true,
          dislikesNum: true,
          updatedBy: { id: true, email: true, firstName: true, lastName: true, avatar: true, avatarSource: true, role: true },
          updatedAt: true
        }
      },
      withDeleted
    } );
    if ( !comment ) throw new NotFoundLocalizedException( i18n, CommentsInfoLocale.TERM_COMMENT );

    comment.seen = true;
    await this.commentRepository.save( comment );
    await this.cacheManager.reset();

    return comment;
  }

  // Update a comment
  async update ( id: string, updateCommentDto: UpdateCommentDto, i18n: I18nContext, metadata: IMetadataDecorator ) {
    const comment = await this.findOne( id, i18n );
    const {
      sanitizedTitle,
      sanitizedContent,
      isApproved
    } = await this.commentSanitizer( updateCommentDto.title, updateCommentDto.content );
    const isAdmin = metadata.user.claims.some( c => c.name === PermissionsEnum.ADMIN || c.name === PermissionsEnum.COMMENT_CREATE );

    comment.title = sanitizedTitle;
    comment.content = sanitizedContent;
    comment.isApproved = isAdmin ? true : isApproved;
    comment.updatedBy = { id: metadata.user.id } as User;
    comment.ipAddress = metadata.ipAddress;
    comment.userAgent = metadata.userAgent;

    const result = await this.commentRepository.save( comment );
    await this.cacheManager.reset();
    return result;
  }

  // Approve comment
  async approve ( id: string, i18n: I18nContext ) {
    const comment = await this.findOne( id, i18n );
    comment.isApproved = true;

    const result = await this.commentRepository.save( comment );
    await this.cacheManager.reset();
    return result;
  }

  // Set/Unset as special
  async setUnsetSpecial ( id: string, i18n: I18nContext ) {
    const comment = await this.findOne( id, i18n );
    comment.isSpecial = !comment.isSpecial;

    const result = await this.commentRepository.save( comment );
    await this.cacheManager.reset();
    return result;
  }

  // Reject comment
  async reject ( id: string, i18n: I18nContext ) {
    const comment = await this.findOne( id, i18n );
    comment.isApproved = false;

    const result = await this.commentRepository.save( comment );
    await this.cacheManager.reset();
    return result;
  }

  // Comment like
  async like ( id: string, i18n: I18nContext, metadata: IMetadataDecorator ): Promise<Comment> {
    const comment = await this.commentRepository.findOne( {
      where: { id },
      relations: { likes: true, dislikes: true, createdBy: true }
    } );
    if ( !comment ) throw new NotFoundLocalizedException( i18n, CommentsInfoLocale.TERM_COMMENT );
    const existingDislike = comment.dislikes.filter( u => u.id === metadata.user.id );
    if ( existingDislike.length ) {
      const filteredDislikes = comment.dislikes.filter( u => u.id !== metadata.user.id );
      comment.dislikes = filteredDislikes;
      comment.dislikesNum = comment.dislikes.length;
      await this.commentRepository.save( comment );
    }
    const existingLike = comment.likes.filter( u => u.id === metadata.user.id );
    if ( existingLike.length ) {
      const filteredLikes = comment.likes.filter( u => u.id !== metadata.user.id );
      comment.likes = filteredLikes;
      comment.likesNum = comment.likes.length;
      const result = await this.commentRepository.save( comment );
      await this.cacheManager.reset();
      return result;
    }
    comment.likes = [ ...comment.likes, { id: metadata.user.id } ] as User[];
    comment.likesNum = comment.likes.length;
    const resultAfterLike = await this.commentRepository.save( comment );
    await this.cacheManager.reset();
    return resultAfterLike;
  }

  // Comment dislike
  async dislike ( id: string, i18n: I18nContext, metadata: IMetadataDecorator ): Promise<Comment> {
    const comment = await this.commentRepository.findOne( {
      where: { id },
      relations: { likes: true, dislikes: true, createdBy: true }
    } );
    if ( !comment ) throw new NotFoundLocalizedException( i18n, CommentsInfoLocale.TERM_COMMENT );
    const existingLike = comment.likes.filter( u => u.id === metadata.user.id );
    if ( existingLike.length ) {
      const filteredLikes = comment.likes.filter( u => u.id !== metadata.user.id );
      comment.likes = filteredLikes;
      comment.likesNum = comment.likes.length;
      await this.commentRepository.save( comment );
    }
    const existingDislike = comment.dislikes.filter( u => u.id === metadata.user.id );
    if ( existingDislike.length ) {
      const filteredDislikes = comment.dislikes.filter( u => u.id !== metadata.user.id );
      comment.dislikes = filteredDislikes;
      comment.dislikesNum = comment.dislikes.length;
      const result = await this.commentRepository.save( comment );
      await this.cacheManager.reset();
      return result;
    }
    comment.dislikes = [ ...comment.dislikes, { id: metadata.user.id } ] as User[];
    comment.dislikesNum = comment.dislikes.length;
    const resultAfterDislike = await this.commentRepository.save( comment );
    await this.cacheManager.reset();
    return resultAfterDislike;
  }

  // Soft remove a comment
  async softRemove ( id: string, i18n: I18nContext ): Promise<Comment> {
    const comment = await this.findOne( id, i18n );
    const post = await this.postsService.findOne( comment.post.id, i18n );
    const result = await this.commentRepository.softRemove( comment );
    await this.postsService.decreasePostCommentsNum( post );
    await this.cacheManager.reset();
    return result;
  }

  // Soft remove comments
  async softRemoveAll ( ids: string[], i18n: I18nContext ): Promise<Comment[]> {
    const comments = await this.commentRepository.find( { relations: { post: true }, where: { id: In( ids ) } } );
    for ( let comment of comments ) {
      const post = await this.postsService.findOne( comment.post.id, i18n );
      await this.postsService.decreasePostCommentsNum( post );
    }

    const result = await this.commentRepository.softRemove( comments );
    await this.cacheManager.reset();
    return result;
  }

  // Find all soft-removed items
  async softRemovedFindAll ( query: PaginationDto ): Promise<IListResultGenerator<Comment>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    const [ items, totalItems ] = await this.commentRepository.findAndCount( {
      relations: {
        parent: true,
        post: true
      },
      withDeleted: true,
      where: { deletedAt: Not( IsNull() ) },
      order: { deletedAt: { direction: 'DESC' } },
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  // Recover a soft-removed comment
  async recover ( id: string, i18n: I18nContext ): Promise<Comment> {
    const comment = await this.findOne( id, i18n, true );
    const post = await this.postsService.findOne( comment.post.id, i18n );
    const result = await this.commentRepository.recover( comment );
    await this.postsService.increasePostCommentsNum( post );
    await this.cacheManager.reset();
    return result;
  }

  // Recover soft-removed comments
  async recoverAll ( ids: string[], i18n: I18nContext ): Promise<Comment[]> {
    const comments = await this.commentRepository.find( { where: { id: In( ids ) }, withDeleted: true } );
    const result = await this.commentRepository.recover( comments );
    for ( let comment of comments ) {
      const post = await this.postsService.findOne( comment.post.id, i18n );
      await this.postsService.increasePostCommentsNum( post );
    }

    await this.cacheManager.reset();
    return result;
  }

  // Remove a comment Permanently
  async remove ( id: string, i18n: I18nContext ): Promise<Comment> {
    const comment = await this.findOne( id, i18n, true );
    const post = await this.postsService.findOne( comment.post.id, i18n );
    const result = await this.commentRepository.remove( comment );
    await this.postsService.decreasePostCommentsNum( post );
    await this.cacheManager.reset();
    return result;
  }

  // Remove comments permanently
  async removeAll ( ids: string[], i18n: I18nContext ): Promise<Comment[]> {
    const comments = await this.commentRepository.find( { where: { id: In( ids ) }, withDeleted: true } );
    for ( let comment of comments ) {
      const post = await this.postsService.findOne( comment.post.id, i18n );
      await this.postsService.decreasePostCommentsNum( post );
    }

    const result = await this.commentRepository.remove( comments );
    await this.cacheManager.reset();

    return result;
  }

  // Empty trash
  async emptyTrash ( i18n: I18nContext ): Promise<void> {
    const softDeletedComments = await this.commentRepository.find( {
      relations: {
        post: true
      },
      where: { deletedAt: Not( IsNull() ) },
      withDeleted: true
    } );
    for ( let comment of softDeletedComments ) {
      const post = await this.postsService.findOne( comment.post.id, i18n );
      await this.postsService.decreasePostCommentsNum( post );
    }

    await this.commentRepository.remove( softDeletedComments );
    await this.cacheManager.reset();
  }

  /********************************************************************************************/
  /********************************** Helper Methods ******************************************/
  /*********************************** Start Region *******************************************/
  /********************************************************************************************/

  // Sanitize comments titles and contents
  async commentSanitizer ( title: string, content: string ): Promise<ICommentSanitizerResult> {
    const sanitizeHtmlOptions = {
      allowedTags: [ 'b', 's', 'i', 'em', 'strong', 'a', 'ul', 'li', 'ol' ],
      allowedAttributes: {
        'a': [ 'href' ]
      },
      allowedIframeHostnames: []
    };

    let sanitizedTitle = title ? sanitizeHtml( title, sanitizeHtmlOptions ) : null;
    let sanitizedContent = sanitizeHtml( content, sanitizeHtmlOptions );
    let isApproved = ( await this.settingsService.findOne( SettingsKeyEnum.COMMENT_IS_APPROVED ) )
      .value === "true";
    const forbiddenExps = ( await this.settingsService.findOne( SettingsKeyEnum.COMMENT_FORBIDDEN_EXPRESSIONS ) )
      .value
      .split( ',' ).map( e => e.trim() );
    const suspendIfForbidden = ( await this.settingsService.findOne( SettingsKeyEnum.COMMENT_FORBIDDEN_SUSPEND ) )
      .value === "true";

    forbiddenExps.map( exp => {
      const titleForbidden = sanitizedTitle?.includes( exp );
      const contentForbidden = sanitizedContent.includes( exp );
      if ( titleForbidden || contentForbidden ) {
        if ( isApproved && suspendIfForbidden ) {
          isApproved = false;
        }
        if ( isApproved && !suspendIfForbidden ) {
          sanitizedTitle = titleForbidden ? sanitizedTitle.replace( exp, '...' ) : sanitizedTitle;
          sanitizedContent = contentForbidden ? sanitizedContent.replace( exp, '...' ) : sanitizedContent;
        }
      }
    } );

    return {
      sanitizedTitle,
      sanitizedContent,
      isApproved
    };
  }

  /********************************************************************************************/
  /************************************ End Region ********************************************/
  /********************************** Helper Methods ******************************************/
  /********************************************************************************************/
}