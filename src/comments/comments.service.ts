import { BadRequestException, CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingsService } from 'src/settings/settings.service';
import { Between, FindOptionsWhere, In, MoreThanOrEqual, Repository } from 'typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';
import * as sanitizeHtml from 'sanitize-html';
import { SettingsKeyEnum } from 'src/settings/types/settings-key.enum';
import { EnvEnum } from 'src/env.enum';
import { ICommentSanitizerResult } from './types/service.type';
import { I18nContext } from 'nestjs-i18n';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { CommentsInfoLocale } from 'src/i18n/locale-keys/comments/info.locale';
import { CommentsErrorsLocale } from 'src/i18n/locale-keys/comments/errors.locale';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { Cache } from 'cache-manager';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { User } from 'src/users/entities/user.entity';
import { CommentQueryListDto } from './dto/comment-query-list.dto';
import { FilterPaginationUtil, IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { PostsService } from 'src/posts/posts.service';

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
    const allowedReplyLevel = +this.configService.getOrThrow( EnvEnum.COMMENT_REPLY_ALLOWED_LEVEL );

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

    const isReplyLevelAllowed = parentComment
      ? ( parentComment.replyLevel + 1 ) <= allowedReplyLevel
      : true;
    if ( !isReplyLevelAllowed ) throw new BadRequestException( i18n.t( CommentsErrorsLocale.REPLY_NOT_ALLOWED ) );
    const isReplyAllowedForCurrentComment = parentComment
      ? ( parentComment.replyLevel + 1 ) < allowedReplyLevel
      : true;
    const currentReplyLevel = parentComment ? ( parentComment.replyLevel + 1 ) : 0;

    const comment = this.commentRepository.create( {
      title: sanitizedTitle,
      content: sanitizedContent,
      parent: parentComment,
      isApproved: isAdmin ? true : isApproved,
      replyLevel: currentReplyLevel,
      isReplyAllowed: isReplyAllowedForCurrentComment,
      post,
      createdBy: { id: metadata.user.id },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    } );

    const result = await this.commentRepository.save( comment );
    await this.cacheManager.reset();

    return result;
  }

  // Find all comments
  async findAll ( query: CommentQueryListDto, postId?: string ): Promise<IListResultGenerator<Comment>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    // TypeORM where object
    const where: FindOptionsWhere<Comment> | FindOptionsWhere<Comment>[] = {
      title: query[ 'searchBy.title' ],
      content: query[ 'searchBy.content' ],
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
    // Add isApproved filter
    if ( query[ 'filterBy.isApproved' ] ) {
      where.isApproved = query[ 'filterBy.isApproved' ];
    }
    // Add is replyAllowed filter
    if ( query[ 'filterBy.isReplyAllowed' ] ) {
      where.isReplyAllowed = query[ 'filterBy.isReplyAllowed' ];
    }
    // Add likes number filter
    if ( query[ 'filterBy.likesNumGte' ] ) {
      where.likesNum = MoreThanOrEqual( query[ 'filterBy.likesNumGte' ] );
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
        relations: [ 'parent', 'post' ]
      },
      relations: {
        createdBy: true,
        updatedBy: true
      },
      where,
      order: {
        title: query[ 'orderBy.title' ],
        content: query[ 'orderBy.content' ],
        isApproved: query[ 'orderBy.isApproved' ],
        likesNum: query[ 'orderBy.likesNum' ],
        isReplyAllowed: query[ 'orderBy.isReplyAllowed' ],
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

  // Find a comment
  async findOne ( id: string, i18n: I18nContext, withDeleted: boolean = false ): Promise<Comment> {
    const comment = await this.commentRepository.findOne( {
      where: { id },
      relations: {
        createdBy: true,
        updatedBy: true,
      },
      loadRelationIds: {
        relations: [ 'parent', 'post' ]
      },
      withDeleted
    } );
    if ( !comment ) throw new NotFoundLocalizedException( i18n, CommentsInfoLocale.TERM_COMMENT );

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
    const result = await this.commentRepository.softRemove( comment );
    await this.cacheManager.reset();
    return result;
  }

  // Recover a soft-removed comment
  async recover ( id: string, i18n: I18nContext ): Promise<Comment> {
    const comment = await this.findOne( id, i18n, true );
    const result = await this.commentRepository.recover( comment );
    await this.cacheManager.reset();
    return result;
  }

  // Remove a comment Permanently
  async remove ( id: string, i18n: I18nContext ): Promise<Comment> {
    const comment = await this.findOne( id, i18n, true );
    const result = await this.commentRepository.remove( comment );
    await this.cacheManager.reset();
    return result;
  }

  /********************************************************************************************/
  /********************************** Helper Methods ******************************************/
  /*********************************** Start Region *******************************************/
  /********************************************************************************************/

  // Sanitize comments titles and contents
  async commentSanitizer ( title: string, content: string ): Promise<ICommentSanitizerResult> {
    const sanitizeHtmlOptions = {
      allowedTags: [ 'b', 'i', 'em', 'strong', 'a' ],
      allowedAttributes: {
        'a': [ 'href' ]
      },
      allowedIframeHostnames: []
    };

    let sanitizedTitle = sanitizeHtml( title, sanitizeHtmlOptions );
    let sanitizedContent = sanitizeHtml( content, sanitizeHtmlOptions );
    let isApproved = ( await this.settingsService.findOne( SettingsKeyEnum.COMMENT_IS_APPROVED ) )
      .value === "true";
    const forbiddenExps = ( await this.settingsService.findOne( SettingsKeyEnum.COMMENT_FORBIDDEN_EXPRESSIONS ) )
      .value
      .split( ',' ).map( e => e.trim() );
    const suspendIfForbidden = ( await this.settingsService.findOne( SettingsKeyEnum.COMMENT_FORBIDDEN_SUSPEND ) )
      .value === "true";

    forbiddenExps.map( exp => {
      const titleForbidden = sanitizedTitle.includes( exp );
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