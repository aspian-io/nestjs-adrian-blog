import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Cache } from 'cache-manager';
import { I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { FilterPaginationUtil, IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { File } from 'src/files/entities/file.entity';
import { PostsErrorsLocale } from 'src/i18n/locale-keys/posts/errors.locale';
import { PostsInfoLocale } from 'src/i18n/locale-keys/posts/info.locale';
import { Taxonomy, TaxonomyTypeEnum } from 'src/taxonomies/entities/taxonomy.entity';
import { User } from 'src/users/entities/user.entity';
import { Between, FindOptionsOrder, FindOptionsWhere, In, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsQueryListDto } from './dto/post-query-list.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { BookmarksListQueryDto } from './dto/user/bookmarks-list-query.dto';
import { UserBlogsListDto } from './dto/user/user-blog-list.dto';
import { PostSlugsHistory } from './entities/post-slug.entity';
import { Post, PostStatusEnum, PostTypeEnum } from './entities/post.entity';
import { IScheduledPostPayload } from './queues/consumers/scheduled-post.consumer';
import { PostJobs } from './queues/jobs.enum';
import { PostQueues } from './queues/queues.enum';
import { IPostReturnFindBySlug } from './types/service.type';

@Injectable()
export class PostsService {
  constructor (
    @InjectRepository( Post ) private readonly postRepository: Repository<Post>,
    @InjectRepository( PostSlugsHistory ) private readonly postSlugsHistoryRepository: Repository<PostSlugsHistory>,
    @Inject( CACHE_MANAGER ) private cacheManager: Cache,
    @InjectQueue( PostQueues.SCHEDULED_POSTS ) private readonly scheduledPostQueue: Queue<IScheduledPostPayload>,
  ) { }

  // Create a new post
  async create ( createPostDto: CreatePostDto, i18n: I18nContext, metadata: IMetadataDecorator ): Promise<Post> {
    // Check for slug duplication
    const duplicatePost = await this.postRepository.findOne( {
      relations: {
        slugsHistory: true
      },
      where: {
        slug: createPostDto.slug,
        slugsHistory: { slug: createPostDto.slug }
      }
    } );
    // Throw slug duplication error
    if ( duplicatePost ) throw new BadRequestException( i18n.t( PostsErrorsLocale.DUPLICATE_POST_SLUG ) );
    const post = this.postRepository.create( {
      ...createPostDto,
      featuredImage: { id: createPostDto?.featuredImageId },
      status: createPostDto?.scheduledToPublish ? PostStatusEnum.FUTURE : createPostDto.status,
      parent: { id: createPostDto?.parentId },
      taxonomies: [ ...new Set( createPostDto.taxonomiesIds ) ].map( tid => ( { id: tid } ) ),
      attachments: [ ...new Set( createPostDto.attachmentsIds ) ].map( aid => ( { id: aid } ) ),
      createdBy: { id: metadata?.user?.id },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    } );

    // Save post into the database
    const result = await this.postRepository.save( post );

    // reset cache
    await this.cacheManager.reset();

    // Add scheduled post jobs to queue
    await this.addScheduledPostJobToQueue( result );

    return result;
  }

  // Find and filter and paginate posts
  async findAll ( query: PostsQueryListDto | UserBlogsListDto, type: PostTypeEnum ): Promise<IListResultGenerator<Post>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );
    const taxonomyFilterType = query[ 'filterBy' ];
    // TypeORM where object
    const where: FindOptionsWhere<Post> | FindOptionsWhere<Post>[] = {
      type,
      taxonomies: [
        query[ 'filterBy.category' ] && { type: TaxonomyTypeEnum.CATEGORY, term: query[ 'filterBy.category' ] },
        query[ 'filterBy.tag' ] && { type: TaxonomyTypeEnum.TAG, term: query[ 'filterBy.tag' ] },
      ],
      visibility: query[ 'filterBy.visibility' ],
      status: query[ 'filterBy.status' ]?.length
        ? In( query[ 'filterBy.status' ] )
        : undefined,
      scheduledToPublish: query[ 'filterBy.scheduledToPublish' ]?.length
        ? Between( query[ 'filterBy.scheduledToPublish' ][ 0 ], query[ 'filterBy.scheduledToPublish' ][ 1 ] )
        : undefined,
      scheduledToArchive: query[ 'filterBy.scheduledToArchive' ]?.length
        ? Between( query[ 'filterBy.scheduledToArchive' ][ 0 ], query[ 'filterBy.scheduledToArchive' ][ 1 ] )
        : undefined,
      commentAllowed: query[ 'filterBy.commentAllowed' ],
      isPinned: query[ 'filterBy.isPinned' ],
      createdAt: query[ 'filterBy.createdAt' ]?.length
        ? Between( query[ 'filterBy.createdAt' ][ 0 ], query[ 'filterBy.createdAt' ][ 1 ] )
        : undefined,
      updatedAt: query[ 'filterBy.updatedAt' ]?.length
        ? Between( query[ 'filterBy.updatedAt' ][ 0 ], query[ 'filterBy.updatedAt' ][ 1 ] )
        : undefined,
      featuredImage: {
        filename: query[ 'filterBy.featuredImage' ]
      }
    };

    // Add likes number filter
    if ( query[ 'filterBy.likesNumGte' ] ) {
      where.likesNum = MoreThanOrEqual( query[ 'filterBy.likesNumGte' ] );
    }
    // Add bookmarks number filter
    if ( query[ 'filterBy.bookmarksNumGte' ] ) {
      where.bookmarksNum = MoreThanOrEqual( query[ 'filterBy.bookmarksNumGte' ] );
    }
    // Add parent title filter
    if ( query[ 'filterBy.parentTitle' ] ) {
      where.parent = {
        title: query[ 'filterBy.parentTitle' ]
      };
    }
    // Add category terms filter
    if ( query[ 'filterBy.categoryTerms' ]?.length ) {
      where.taxonomies[ 0 ] = {
        type: TaxonomyTypeEnum.CATEGORY,
        term: In( query[ 'filterBy.categoryTerms' ] )
      };
    }
    // Add tag terms filter
    if ( query[ 'filterBy.tagTerms' ]?.length ) {
      where.taxonomies[ 1 ] = {
        type: TaxonomyTypeEnum.TAG,
        term: In( query[ 'filterBy.tagTerms' ] )
      };
    }
    // Add attachment filename filter
    if ( query[ 'filterBy.filenames' ]?.length ) {
      where.attachments = {
        filename: In( query[ 'filterBy.filenames' ] )
      };
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

    // TypeORM order object
    const order: FindOptionsOrder<Post> = {
      viewCount: query[ 'orderBy.viewCount' ],
      likesNum: query[ 'orderBy.likesNum' ],
      bookmarksNum: query[ 'orderBy.bookmarksNum' ],
      createdAt: query[ 'orderBy.createdAt' ],
      updatedAt: query[ 'orderBy.updatedAt' ],
      ipAddress: query[ 'orderBy.ipAddress' ],
      userAgent: query[ 'orderBy.userAgent' ],
      title: query[ 'orderBy.title' ],
      subtitle: query[ 'orderBy.subtitle' ],
    };

    // Get the result from database
    const [ items, totalItems ] = await this.postRepository.findAndCount( {
      relations: {
        attachments: true,
        createdBy: true,
        updatedBy: true,
        featuredImage: true,
        parent: true,
        taxonomies: true
      },
      where,
      order,
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  // Find all user bookmarks
  async findAllBookmarks ( query: BookmarksListQueryDto, userId: string ) {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    const [ items, totalItems ] = await this.postRepository.findAndCount( {
      relations: {
        bookmarks: true
      },
      where: {
        bookmarks: {
          id: userId
        }
      },
      skip,
      take,
    } );

    const reversedItems = items.reverse();

    return FilterPaginationUtil.resultGenerator( reversedItems, totalItems, limit, page );
  }

  // Find a post
  async findOne ( id: string, i18n: I18nContext, withDeleted: boolean = false ): Promise<Post> {
    const post = await this.postRepository.findOne( {
      relations: {
        featuredImage: true,
        taxonomies: true,
        attachments: true,
        bookmarks: true,
        likes: true,
        parent: true,
        child: true,
        createdBy: true,
        updatedBy: true,
        slugsHistory: true
      },
      where: {
        id
      },
      withDeleted
    } );

    if ( !post ) throw new NotFoundLocalizedException( i18n, PostsInfoLocale.TERM_POST );

    return post;
  }

  // Find a post by slug
  async findBySlug ( slug: string, i18n: I18nContext, type?: PostTypeEnum ): Promise<IPostReturnFindBySlug> {
    const post = await this.postRepository.findOne( {
      relations: {
        featuredImage: true,
        taxonomies: true,
        attachments: true,
        child: true,
        parent: true,
        createdBy: true,
        updatedBy: true,
        slugsHistory: true
      },
      where: {
        slug,
        type
      }
    } );

    if ( !post ) {
      const postWithOldSlug = await this.postRepository.findOne( {
        relations: {
          featuredImage: true,
          taxonomies: true,
          attachments: true,
          child: true,
          parent: true,
          createdBy: true,
          updatedBy: true,
          slugsHistory: true
        },
        where: {
          slugsHistory: { slug },
          type
        }
      } );
      if ( !postWithOldSlug ) throw new NotFoundLocalizedException( i18n, PostsInfoLocale.TERM_POST );

      return { post: postWithOldSlug, redirect: { status: 301 } };
    };
    post.viewCount++;
    await this.postRepository.save( post );

    return { post };
  }

  // Update a post and its related meta
  async update ( id: string, updatePostDto: UpdatePostDto, i18n: I18nContext, metadata: IMetadataDecorator ): Promise<Post> {
    const post = await this.findOne( id, i18n );

    // Check for slug duplication
    const duplicatePost = await this.postRepository.findOne( {
      relations: {
        slugsHistory: true
      },
      where: {
        id: Not( post.id ),
        slug: updatePostDto.slug,
        slugsHistory: {
          slug: updatePostDto.slug
        }
      }
    } );
    // Throw slug duplication error
    if ( duplicatePost ) throw new BadRequestException( i18n.t( PostsErrorsLocale.DUPLICATE_POST_SLUG ) );

    // Store old slugs for redirection
    if ( updatePostDto.slug != post.slug && updatePostDto.storeOldSlugToRedirect ) {
      post.slugsHistory.push( {
        slug: post.slug,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      } as PostSlugsHistory );
    }

    Object.assign( post, updatePostDto );

    updatePostDto?.featuredImageId
      ? post.featuredImage = { id: updatePostDto.featuredImageId } as File
      : null;

    post.taxonomies = updatePostDto?.taxonomiesIds?.length
      ? updatePostDto.taxonomiesIds.map( tid => ( { id: tid } ) ) as Taxonomy[]
      : [];

    post.attachments = updatePostDto?.attachmentsIds?.length
      ? updatePostDto?.attachmentsIds.map( aid => ( { id: aid } ) ) as File[]
      : [];

    updatePostDto?.parentId
      ? post.parent = { id: updatePostDto?.parentId } as Post
      : null;

    post.updatedBy = { id: metadata?.user?.id } as User;
    post.ipAddress = metadata.ipAddress;
    post.userAgent = metadata.userAgent;

    const result = await this.postRepository.save( post );
    await this.cacheManager.reset();

    return result;
  }

  // Delete a slug history
  async removeOldSlug ( slugId: string, i18n: I18nContext ) {
    const slug = await this.postSlugsHistoryRepository.findOne( { where: { id: slugId } } );
    if ( !slug ) throw new NotFoundLocalizedException( i18n, PostsInfoLocale.TERM_POST_OLD_SLUG );

    return this.postSlugsHistoryRepository.remove( slug );
  }

  // Like post
  async like ( postId: string, metadata: IMetadataDecorator, i18n: I18nContext ): Promise<Post> {
    const post = await this.postRepository.findOne( {
      where: { id: postId },
      relations: { likes: true }
    } );
    if ( !post ) throw new NotFoundLocalizedException( i18n, PostsInfoLocale.TERM_POST );
    const existingLike = post.likes.filter( u => u.id === metadata.user.id );
    if ( existingLike.length ) {
      const filteredLikes = post.likes.filter( u => u.id !== metadata.user.id );
      post.likes = filteredLikes;
      post.likesNum = post.likes.length;
      const result = await this.postRepository.save( post );
      await this.cacheManager.reset();
      return result;
    }
    post.likes = [ ...post.likes, { id: metadata.user.id } ] as User[];
    post.likesNum = post.likes.length;
    const resultAfterLike = await this.postRepository.save( post );
    await this.cacheManager.reset();
    return resultAfterLike;
  }

  // Bookmark post
  async bookmark ( postId: string, metadata: IMetadataDecorator, i18n: I18nContext ): Promise<Post> {
    const post = await this.postRepository.findOne( {
      where: { id: postId },
      relations: { bookmarks: true }
    } );
    if ( !post ) throw new NotFoundLocalizedException( i18n, PostsInfoLocale.TERM_POST );
    const existingBookmark = post.bookmarks.filter( u => u.id === metadata.user.id );
    if ( existingBookmark.length ) {
      const filteredBookmarks = post.bookmarks.filter( u => u.id !== metadata.user.id );
      post.bookmarks = filteredBookmarks;
      post.bookmarksNum = post.bookmarks.length;
      const result = await this.postRepository.save( post );
      await this.cacheManager.reset();
      return result;
    }
    post.bookmarks = [ ...post.bookmarks, { id: metadata.user.id } ] as User[];
    post.bookmarksNum = post.bookmarks.length;
    const resultAfterBookmark = await this.postRepository.save( post );
    await this.cacheManager.reset();
    return resultAfterBookmark;
  }

  // Soft remove a post
  async softRemove ( id: string, i18n: I18nContext ) {
    const post = await this.findOne( id, i18n, true );

    const result = await this.postRepository.softRemove( post );
    await this.cacheManager.reset();

    return result;
  }

  // Recover soft-removed post
  async recover ( id: string, i18n: I18nContext ) {
    const post = await this.findOne( id, i18n, true );

    const result = await this.postRepository.recover( post );
    await this.cacheManager.reset();

    return result;
  }

  // Remove a post permanently
  async remove ( id: string, i18n: I18nContext ) {
    const post = await this.findOne( id, i18n, true );

    const result = await this.postRepository.remove( post );
    await this.cacheManager.reset();

    return result;
  }


  /********************************************************************************************/
  /********************************** Helper Methods ******************************************/
  /*********************************** Start Region *******************************************/
  /********************************************************************************************/

  // Add scheduled post jobs to queue
  async addScheduledPostJobToQueue ( post: Post ) {
    // Schedule to publish if schedule date exists
    if ( post?.scheduledToPublish ) {
      const delay = post.scheduledToPublish.getTime() - Date.now();
      await this.scheduledPostQueue.add( PostJobs.SCHEDULED_POST_TO_PUBLISH, { id: post.id }, { delay } );
    }

    // Schedule to archive if schedule date exists
    if ( post?.scheduledToArchive ) {
      const delay = post.scheduledToArchive.getTime() - Date.now();
      await this.scheduledPostQueue.add( PostJobs.SCHEDULED_POST_TO_ARCHIVE, { id: post.id }, { delay } );
    }
  }

  /********************************************************************************************/
  /************************************ End Region ********************************************/
  /********************************** Helper Methods ******************************************/
  /********************************************************************************************/
}
