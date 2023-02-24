import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, CACHE_MANAGER, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, JobId, Queue } from 'bull';
import { Cache } from 'cache-manager';
import { I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { FilterPaginationUtil, IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { File } from 'src/files/entities/file.entity';
import { PostsErrorsLocale } from 'src/i18n/locale-keys/posts/errors.locale';
import { PostsInfoLocale } from 'src/i18n/locale-keys/posts/info.locale';
import { Taxonomy, TaxonomyTypeEnum } from 'src/taxonomies/entities/taxonomy.entity';
import { User } from 'src/users/entities/user.entity';
import { Between, FindOptionsOrder, FindOptionsWhere, In, IsNull, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsQueryListDto } from './dto/post-query-list.dto';
import { PostsJobsQueryDto } from './dto/posts-jobs-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { BookmarksListQueryDto } from './dto/user/bookmarks-list-query.dto';
import { SearchDto } from './dto/user/search.dto';
import { UserBlogsListDto } from './dto/user/user-blog-list.dto';
import { PostSlugsHistory } from './entities/post-slug.entity';
import { Post, PostStatusEnum, PostTypeEnum, PostVisibilityEnum, WidgetTypeEnum } from './entities/post.entity';
import { IScheduledPostPayload } from './queues/consumers/scheduled-post.consumer';
import { PostJobs } from './queues/jobs.enum';
import { PostQueues } from './queues/queues.enum';
import { IPostReturnFindBySlug, PostErrorsEnum, PostErrorsInternalCodeEnum, PostsDelayedJobs } from './types/service.type';

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
      where: { slug: createPostDto.slug, type: createPostDto.type },
    } );
    const duplicateSlugHistory = await this.postSlugsHistoryRepository.findOne( {
      relations: { post: true },
      where: { slug: createPostDto.slug, post: { type: createPostDto.type } }
    } );
    // Throw slug duplication error
    if ( duplicatePost || duplicateSlugHistory ) {
      throw new BadRequestException( {
        statusCode: 400,
        internalCode: PostErrorsInternalCodeEnum.DUPLICATE_SLUG,
        message: i18n.t( PostsErrorsLocale.DUPLICATE_POST_SLUG ),
        error: PostErrorsEnum.DUPLICATE_SLUG
      } );
    }

    let postStatus = createPostDto?.scheduledToPublish ? PostStatusEnum.FUTURE : createPostDto.status;

    const parent = createPostDto.parentId ? await this.findOne( createPostDto.parentId, i18n ) : null;
    let ancestor: Post = null;
    if ( parent ) {
      ancestor = parent?.ancestor ? parent.ancestor : parent;
    }

    const post = this.postRepository.create( {
      ...createPostDto,
      scheduledToPublish: createPostDto.status === PostStatusEnum.FUTURE ? createPostDto?.scheduledToPublish : null,
      scheduledToArchive: createPostDto.status === PostStatusEnum.FUTURE ? createPostDto?.scheduledToArchive : null,
      featuredImage: { id: createPostDto?.featuredImageId },
      status: createPostDto?.parentId ? PostStatusEnum.INHERIT : postStatus,
      parent,
      projectOwner: createPostDto?.projectOwnerId ? { id: createPostDto.projectOwnerId } : null,
      ancestor,
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

  // Find All Widgets by Type
  findAllWidgetsByType ( type: WidgetTypeEnum ) {
    return this.postRepository.find( {
      relations: {
        featuredImage: {
          generatedImageChildren: true
        },
        attachments: true,
        taxonomies: true,
        parent: true,
        child: true,
        ancestor: true
      },
      where: {
        type
      },
      order: {
        createdAt: { direction: 'DESC' }
      }
    } );
  }

  // Find and filter and paginate posts
  async findAll ( query: PostsQueryListDto & UserBlogsListDto, type: PostTypeEnum, admin: boolean = true ): Promise<IListResultGenerator<Post>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    // TypeORM where object for admin
    const where: FindOptionsWhere<Post> | FindOptionsWhere<Post>[] = {
      type,
      title: query[ 'searchBy.title' ],
      subtitle: query[ 'searchBy.subtitle' ],
      content: query[ 'searchBy.content' ],
      parent: {
        title: query[ 'searchBy.parentTitle' ]
      },
      projectOwner: {
        email: query[ 'searchBy.projectOwner' ]
      },
      slug: query[ 'searchBy.slug' ],
      taxonomies: [
        query[ 'filterBy.category' ] && { type: TaxonomyTypeEnum.CATEGORY, term: query[ 'filterBy.category' ] },
        query[ 'filterBy.projectCategory' ] && { type: TaxonomyTypeEnum.PROJECT_CATEGORY, term: query[ 'filterBy.projectCategory' ] },
        query[ 'searchBy.tag' ] && { type: TaxonomyTypeEnum.TAG, term: query[ 'searchBy.tag' ] },
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

    // Add view count number filter
    if ( query[ 'filterBy.viewCountGte' ] ) {
      where.viewCount = MoreThanOrEqual( query[ 'filterBy.viewCountGte' ] );
    }
    // Add comments number filter
    if ( query[ 'filterBy.commentsNumGte' ] ) {
      where.commentsNum = MoreThanOrEqual( query[ 'filterBy.commentsNumGte' ] );
    }
    // Add likes number filter
    if ( query[ 'filterBy.likesNumGte' ] ) {
      where.likesNum = MoreThanOrEqual( query[ 'filterBy.likesNumGte' ] );
    }
    // Add bookmarks number filter
    if ( query[ 'filterBy.bookmarksNumGte' ] ) {
      where.bookmarksNum = MoreThanOrEqual( query[ 'filterBy.bookmarksNumGte' ] );
    }
    // Add category terms filter
    if ( query[ 'filterBy.categoryTerms' ]?.length ) {
      where.taxonomies = [ {
        type: TaxonomyTypeEnum.CATEGORY,
        term: In( query[ 'filterBy.categoryTerms' ] )
      } ];
    }
    // Add tag terms filter
    if ( query[ 'filterBy.tagTerms' ]?.length ) {
      where.taxonomies = {
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

    // TypeORM order object for admin
    const order: FindOptionsOrder<Post> = {
      title: query[ 'orderBy.title' ],
      subtitle: query[ 'orderBy.subtitle' ],
      viewCount: query[ 'orderBy.viewCount' ],
      commentsNum: query[ 'orderBy.commentsNum' ],
      likesNum: query[ 'orderBy.likesNum' ],
      bookmarksNum: query[ 'orderBy.bookmarksNum' ],
      createdAt: query[ 'orderBy.createdAt' ],
      updatedAt: query[ 'orderBy.updatedAt' ],
      ipAddress: query[ 'orderBy.ipAddress' ],
      userAgent: query[ 'orderBy.userAgent' ],
    };

    // TypeORM where array for user (no admin)
    const notAdminWhere: FindOptionsWhere<Post> | FindOptionsWhere<Post>[] = [
      {
        type,
        title: query?.search,
        visibility: PostVisibilityEnum.PUBLIC,
        status: In( [ PostStatusEnum.PUBLISH, PostStatusEnum.INHERIT ] ),
        ancestor: [
          {
            id: IsNull(),
          },
          {
            status: PostStatusEnum.PUBLISH,
          }
        ],
        taxonomies: [
          query[ 'filterBy.category' ] && { type: TaxonomyTypeEnum.CATEGORY, term: query[ 'filterBy.category' ] },
          query[ 'filterBy.projectCategory' ] && { type: TaxonomyTypeEnum.PROJECT_CATEGORY, term: query[ 'filterBy.projectCategory' ] },
          query[ 'filterBy.tag' ] && { type: TaxonomyTypeEnum.TAG, term: query[ 'filterBy.tag' ] },
          query[ 'filterBy.tagTerms' ] && query[ 'filterBy.tagTerms' ].length > 0 && { type: TaxonomyTypeEnum.TAG, term: In( query[ 'filterBy.tagTerms' ] ) }
        ]
      },
      {
        type,
        subtitle: query?.search,
        visibility: PostVisibilityEnum.PUBLIC,
        status: In( [ PostStatusEnum.PUBLISH, PostStatusEnum.INHERIT ] ),
        ancestor: [
          {
            id: IsNull(),
          },
          {
            status: PostStatusEnum.PUBLISH,
          }
        ],
        taxonomies: [
          query[ 'filterBy.category' ] && { type: TaxonomyTypeEnum.CATEGORY, term: query[ 'filterBy.category' ] },
          query[ 'filterBy.projectCategory' ] && { type: TaxonomyTypeEnum.PROJECT_CATEGORY, term: query[ 'filterBy.projectCategory' ] },
          query[ 'filterBy.tag' ] && { type: TaxonomyTypeEnum.TAG, term: query[ 'filterBy.tag' ] },
          query[ 'filterBy.tagTerms' ] && query[ 'filterBy.tagTerms' ].length > 0 && { type: TaxonomyTypeEnum.TAG, term: In( query[ 'filterBy.tagTerms' ] ) }
        ]
      },
      {
        type,
        content: query?.search,
        visibility: PostVisibilityEnum.PUBLIC,
        status: In( [ PostStatusEnum.PUBLISH, PostStatusEnum.INHERIT ] ),
        ancestor: [
          {
            id: IsNull(),
          },
          {
            status: PostStatusEnum.PUBLISH,
          }
        ],
        taxonomies: [
          query[ 'filterBy.category' ] && { type: TaxonomyTypeEnum.CATEGORY, term: query[ 'filterBy.category' ] },
          query[ 'filterBy.projectCategory' ] && { type: TaxonomyTypeEnum.PROJECT_CATEGORY, term: query[ 'filterBy.projectCategory' ] },
          query[ 'filterBy.tag' ] && { type: TaxonomyTypeEnum.TAG, term: query[ 'filterBy.tag' ] },
          query[ 'filterBy.tagTerms' ] && query[ 'filterBy.tagTerms' ].length > 0 && { type: TaxonomyTypeEnum.TAG, term: In( query[ 'filterBy.tagTerms' ] ) }
        ]
      },
    ];

    // TypeORM order object for user (no admin)
    const notAdminOrder: FindOptionsOrder<Post> = {
      viewCount: query[ 'orderBy.viewCount' ],
      commentsNum: query[ 'orderBy.commentsNum' ],
      likesNum: query[ 'orderBy.likesNum' ],
      bookmarksNum: query[ 'orderBy.bookmarksNum' ],
      createdAt: query[ 'orderBy.createdAt' ],
    };

    // Get the result from database
    const [ items, totalItems ] = await this.postRepository.findAndCount( {
      relations: {
        ancestor: true,
        attachments: true,
        createdBy: true,
        updatedBy: true,
        featuredImage: true,
        parent: true,
        child: true,
        taxonomies: true,
        projectOwner: true
      },
      where: admin ? where : notAdminWhere,
      order: admin ? order : notAdminOrder,
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
        bookmarks: true,
        createdBy: true,
        featuredImage: true,
        taxonomies: true
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

  async search ( query: SearchDto ): Promise<IListResultGenerator<Post>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    // Get the result from database
    const [ items, totalItems ] = await this.postRepository.findAndCount( {
      relations: {
        ancestor: true,
        attachments: true,
        createdBy: true,
        updatedBy: true,
        featuredImage: true,
        parent: true,
        child: true,
        taxonomies: true,
        projectOwner: true
      },
      where: [
        {
          title: query.keyword,
          type: PostTypeEnum.BLOG,
          status: PostStatusEnum.PUBLISH,
          visibility: PostVisibilityEnum.PUBLIC
        },
        {
          subtitle: query.keyword,
          type: PostTypeEnum.BLOG,
          status: PostStatusEnum.PUBLISH,
          visibility: PostVisibilityEnum.PUBLIC
        },
        {
          title: query.keyword,
          type: PostTypeEnum.NEWS,
          status: PostStatusEnum.PUBLISH,
          visibility: PostVisibilityEnum.PUBLIC
        },
        {
          subtitle: query.keyword,
          type: PostTypeEnum.NEWS,
          status: PostStatusEnum.PUBLISH,
          visibility: PostVisibilityEnum.PUBLIC
        },
        {
          title: query.keyword,
          type: PostTypeEnum.PROJECT,
          status: PostStatusEnum.PUBLISH,
          visibility: PostVisibilityEnum.PUBLIC
        },
        {
          subtitle: query.keyword,
          type: PostTypeEnum.PROJECT,
          status: PostStatusEnum.PUBLISH,
          visibility: PostVisibilityEnum.PUBLIC
        },
      ],
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  // Find and filter and paginate posts
  async findRecentPosts ( query: PaginationDto ): Promise<IListResultGenerator<Post>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    // Get the result from database
    const [ items, totalItems ] = await this.postRepository.findAndCount( {
      relations: {
        ancestor: true,
        attachments: true,
        createdBy: true,
        updatedBy: true,
        featuredImage: true,
        parent: true,
        child: true,
        taxonomies: true,
        projectOwner: true
      },
      where: {
        type: In( [ PostTypeEnum.BLOG, PostTypeEnum.NEWS, PostTypeEnum.PAGE, PostTypeEnum.PROJECT ] )
      },
      order: {
        createdAt: {
          direction: 'DESC'
        }
      },
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  // Find all sitemap info
  async sitemap (): Promise<Post[]> {
    return this.postRepository.find( {
      where: {
        status: PostStatusEnum.PUBLISH,
        type: In( [ PostTypeEnum.BLOG, PostTypeEnum.NEWS, PostTypeEnum.PAGE, PostTypeEnum.PROJECT ] ),
        visibility: PostVisibilityEnum.PUBLIC
      },
      select: {
        type: true,
        slug: true,
        updatedAt: true
      }
    } );
  }

  // Find a post
  async findOne ( id: string, i18n?: I18nContext, withDeleted: boolean = false ): Promise<Post> {
    const post = await this.postRepository.findOne( {
      relations: {
        ancestor: true,
        featuredImage: { generatedImageChildren: true },
        taxonomies: true,
        attachments: { generatedImageChildren: true },
        bookmarks: true,
        likes: true,
        parent: true,
        child: true,
        createdBy: true,
        updatedBy: true,
        slugsHistory: true,
        projectOwner: true
      },
      where: {
        id
      },
      withDeleted
    } );
    if ( !post && i18n ) throw new NotFoundLocalizedException( i18n, PostsInfoLocale.TERM_POST );
    if ( !post && !i18n ) throw new NotFoundException();

    return post;
  }

  // Find a post or null
  async findOneOrNull ( id: string, i18n?: I18nContext, withDeleted: boolean = false ): Promise<Post> {
    return this.postRepository.findOne( {
      relations: {
        ancestor: true,
        featuredImage: { generatedImageChildren: true },
        taxonomies: true,
        attachments: { generatedImageChildren: true },
        bookmarks: true,
        likes: true,
        parent: true,
        child: true,
        createdBy: true,
        updatedBy: true,
        slugsHistory: true,
        projectOwner: true
      },
      where: {
        id
      },
      withDeleted
    } );
  }

  // Find a post by slug
  async findBySlug ( slug: string, i18n: I18nContext, type?: PostTypeEnum, admin: boolean = true ): Promise<IPostReturnFindBySlug> {
    const where: FindOptionsWhere<Post> = {
      slug,
      type
    };

    const notAdminWhere: FindOptionsWhere<Post> | FindOptionsWhere<Post>[] = [
      {
        status: PostStatusEnum.PUBLISH,
        visibility: PostVisibilityEnum.PUBLIC,
        slug,
        type
      },
      {
        status: PostStatusEnum.INHERIT,
        ancestor: {
          status: PostStatusEnum.PUBLISH
        },
        visibility: PostVisibilityEnum.PUBLIC,
        slug,
        type,
      }
    ];

    const post = await this.postRepository.findOne( {
      loadRelationIds: {
        relations: [ 'likes', 'bookmarks' ]
      },
      relations: {
        ancestor: true,
        featuredImage: { generatedImageChildren: true },
        taxonomies: true,
        attachments: { generatedImageChildren: true },
        child: true,
        parent: true,
        createdBy: true,
        updatedBy: true,
        slugsHistory: true,
        projectOwner: true
      },
      where: admin ? where : notAdminWhere
    } );

    if ( !post ) {
      const where: FindOptionsWhere<Post> = {
        slugsHistory: { slug },
        type
      };

      const notAdminWhere: FindOptionsWhere<Post> = {
        status: PostStatusEnum.PUBLISH,
        visibility: PostVisibilityEnum.PUBLIC,
        slugsHistory: { slug },
        type
      };

      const postWithOldSlug = await this.postRepository.findOne( {
        loadRelationIds: {
          relations: [ 'likes', 'bookmarks' ]
        },
        relations: {
          ancestor: true,
          featuredImage: { generatedImageChildren: true },
          taxonomies: true,
          attachments: { generatedImageChildren: true },
          child: true,
          parent: true,
          createdBy: true,
          updatedBy: true,
          slugsHistory: true
        },
        where: admin ? where : notAdminWhere
      } );
      if ( !postWithOldSlug ) throw new NotFoundLocalizedException( i18n, PostsInfoLocale.TERM_POST );

      return { post: postWithOldSlug, redirect: { status: 301 } };
    };
    await this.viewCountPlusOne( post.id );

    return { post };
  }

  async viewCountPlusOne ( id: string ) {
    const post = await this.findOneOrNull( id );
    if ( post ) {
      post.viewCount++;
      await this.postRepository.save( post );
    }
  }

  async allBlogsNumber () {
    const [ items, totalItems ] = await this.postRepository.findAndCount( { where: { type: PostTypeEnum.BLOG } } );
    return totalItems;
  }

  async allNewsNumber () {
    const [ items, totalItems ] = await this.postRepository.findAndCount( { where: { type: PostTypeEnum.NEWS } } );
    return totalItems;
  }

  async allProjectsNumber () {
    const [ items, totalItems ] = await this.postRepository.findAndCount( { where: { type: PostTypeEnum.PROJECT } } );
    return totalItems;
  }

  // Update a post and its related meta
  async update ( id: string, updatePostDto: UpdatePostDto, i18n: I18nContext, metadata: IMetadataDecorator ): Promise<Post> {
    const post = await this.findOne( id, i18n );

    // Check for slug duplication
    const duplicatePost = await this.postRepository.findOne( {
      where: {
        id: Not( post.id ),
        slug: updatePostDto.slug
      }
    } );
    const duplicateSlugHistory = await this.postSlugsHistoryRepository.findOne( {
      relations: { post: true },
      where: { slug: updatePostDto.slug, post: { id: Not( post.id ), type: post.type } }
    } );
    // Throw slug duplication error
    if ( duplicatePost || duplicateSlugHistory ) {
      throw new BadRequestException( {
        statusCode: 400,
        internalCode: PostErrorsInternalCodeEnum.DUPLICATE_SLUG,
        message: i18n.t( PostsErrorsLocale.DUPLICATE_POST_SLUG ),
        error: PostErrorsEnum.DUPLICATE_SLUG
      } );
    }

    // Store old slugs for redirection
    if ( updatePostDto.slug != post.slug && updatePostDto.storeOldSlugToRedirect ) {
      updatePostDto.slugsHistory.push( {
        slug: post.slug,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      } as PostSlugsHistory );
    }

    const futureStatusChanged = post.status === PostStatusEnum.FUTURE && updatePostDto.status !== PostStatusEnum.FUTURE;
    const publishDateChanged = post.scheduledToPublish && post.scheduledToPublish !== updatePostDto.scheduledToPublish;
    const archiveDateChanged = post.scheduledToArchive && post.scheduledToArchive !== updatePostDto.scheduledToArchive;

    if ( futureStatusChanged || publishDateChanged || archiveDateChanged ) {
      const delayedJobs = await this.scheduledPostQueue.getDelayed();
      const jobsToDelete = delayedJobs.filter( j => j.data.id === post.id );
      if ( jobsToDelete && jobsToDelete.length > 0 ) {
        const deletePromises = jobsToDelete.map( j => j.remove() );
        await Promise.all( deletePromises );
      }
    }

    Object.assign( post, updatePostDto );

    if ( updatePostDto?.projectOwnerId ) post.projectOwner = { id: updatePostDto.projectOwnerId } as User;

    post.featuredImage = updatePostDto?.featuredImageId
      ? { id: updatePostDto.featuredImageId } as File
      : null;

    post.taxonomies = updatePostDto?.taxonomiesIds?.length
      ? updatePostDto.taxonomiesIds.map( tid => ( { id: tid } ) ) as Taxonomy[]
      : [];

    post.attachments = updatePostDto?.attachmentsIds?.length
      ? updatePostDto?.attachmentsIds.map( aid => ( { id: aid } ) ) as File[]
      : [];

    post.scheduledToPublish = updatePostDto.status === PostStatusEnum.FUTURE ? updatePostDto?.scheduledToPublish : null;
    post.scheduledToArchive = updatePostDto.status === PostStatusEnum.FUTURE ? updatePostDto?.scheduledToArchive : null;

    if ( updatePostDto?.parentId ) {
      const parent = await this.postRepository.findOne( { where: { id: updatePostDto.parentId } } );
      if ( !parent ) throw new NotFoundLocalizedException( i18n, PostsInfoLocale.TERM_PARENT_POST );
      post.parent = parent;
      post.status = PostStatusEnum.INHERIT;
      post.ancestor = parent?.ancestor ? parent.ancestor : parent;
    } else {
      post.parent = null;
    }

    post.updatedBy = { id: metadata?.user?.id } as User;
    post.ipAddress = metadata.ipAddress;
    post.userAgent = metadata.userAgent;

    const result = await this.postRepository.save( post );
    await this.cacheManager.reset();
    // Add scheduled post jobs to queue
    await this.addScheduledPostJobToQueue( result );

    return result;
  }

  // Increasing comments number by one
  increasePostCommentsNum ( post: Post ): Promise<Post> {
    post.commentsNum += 1;
    return this.postRepository.save( post );
  }

  // Decreasing comments number by one
  decreasePostCommentsNum ( post: Post, decreaseNumber: number = 1 ): Promise<Post> {
    if ( post.commentsNum > 0 ) {
      post.commentsNum -= decreaseNumber;
      if ( post.commentsNum < 0 ) post.commentsNum = 0;
      return this.postRepository.save( post );
    }
    return;
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

    const delayedJobs = await this.scheduledPostQueue.getDelayed();
    const jobsToDelete = delayedJobs.filter( j => j.data.id === post.id );
    if ( jobsToDelete && jobsToDelete.length > 0 ) {
      const deletePromises = jobsToDelete.map( j => j.remove() );
      await Promise.all( deletePromises );
    }

    const result = await this.postRepository.softRemove( post );
    await this.cacheManager.reset();

    return result;
  }

  // Soft remove posts
  async softRemoveAll ( ids: string[] ): Promise<Post[]> {
    const posts = await this.postRepository.find( { where: { id: In( ids ) } } );

    const deleteJobsPromises = posts.map( async p => {
      if ( p.status === PostStatusEnum.FUTURE ) {
        const delayedJobs = await this.scheduledPostQueue.getDelayed();
        const jobsToDelete = delayedJobs.filter( j => j.data.id === p.id );
        if ( jobsToDelete && jobsToDelete.length > 0 ) {
          const deletePromises = jobsToDelete.map( j => j.remove() );
          await Promise.all( deletePromises );
        }
      }
    } );

    await Promise.all( deleteJobsPromises );

    const result = await this.postRepository.softRemove( posts );
    await this.cacheManager.reset();
    return result;
  }

  // Find all soft-removed items
  async softRemovedFindAll ( query: PaginationDto, type: PostTypeEnum ): Promise<IListResultGenerator<Post>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    const [ items, totalItems ] = await this.postRepository.findAndCount( {
      relations: {
        parent: true,
      },
      withDeleted: true,
      where: { deletedAt: Not( IsNull() ), type },
      order: { deletedAt: { direction: 'DESC' } },
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  // Recover soft-removed post
  async recover ( id: string, i18n: I18nContext ) {
    const post = await this.findOne( id, i18n, true );

    const result = await this.postRepository.recover( post );
    await this.cacheManager.reset();

    return result;
  }

  // Recover soft-removed posts
  async recoverAll ( ids: string[] ): Promise<Post[]> {
    const posts = await this.postRepository.find( { where: { id: In( ids ) }, withDeleted: true } );

    const result = await this.postRepository.recover( posts );
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

  // Remove posts permanently
  async removeAll ( ids: string[] ): Promise<Post[]> {
    const posts = await this.postRepository.find( { where: { id: In( ids ) }, withDeleted: true } );

    const deleteJobsPromises = posts.map( async p => {
      if ( p.status === PostStatusEnum.FUTURE ) {
        const delayedJobs = await this.scheduledPostQueue.getDelayed();
        const jobsToDelete = delayedJobs.filter( j => j.data.id === p.id );
        if ( jobsToDelete && jobsToDelete.length > 0 ) {
          const deletePromises = jobsToDelete.map( j => j.remove() );
          await Promise.all( deletePromises );
        }
      }
    } );

    await Promise.all( deleteJobsPromises );

    const result = await this.postRepository.remove( posts );
    await this.cacheManager.reset();

    return result;
  }

  // Empty trash
  async emptyTrash ( type: PostTypeEnum ): Promise<void> {
    const softDeletedPosts = await this.postRepository.find( {
      where: { deletedAt: Not( IsNull() ), type },
      withDeleted: true
    } );

    const deleteJobsPromises = softDeletedPosts.map( async p => {
      if ( p.status === PostStatusEnum.FUTURE ) {
        const delayedJobs = await this.scheduledPostQueue.getDelayed();
        const jobsToDelete = delayedJobs.filter( j => j.data.id === p.id );
        if ( jobsToDelete && jobsToDelete.length > 0 ) {
          const deletePromises = jobsToDelete.map( j => j.remove() );
          await Promise.all( deletePromises );
        }
      }
    } );

    await Promise.all( deleteJobsPromises );

    await this.postRepository.remove( softDeletedPosts );
    await this.cacheManager.reset();
  }

  // Find all delayed jobs
  async findAllDelayedJobs ( postsJobsPaginationDto: PostsJobsQueryDto )
    : Promise<IListResultGenerator<PostsDelayedJobs>> {
    const { page, limit } = postsJobsPaginationDto;
    let delayed = await this.scheduledPostQueue.getDelayed();
    if ( postsJobsPaginationDto.type ) {
      delayed = delayed.filter( d => d.data.type === postsJobsPaginationDto.type );
    }
    return this.sortAndPaginatePostsJobs( delayed, page, limit );
  }

  // Find all completed jobs
  async findAllCompletedJobs ( postsJobsPaginationDto: PostsJobsQueryDto )
    : Promise<IListResultGenerator<PostsDelayedJobs>> {
    const { page, limit } = postsJobsPaginationDto;
    let completedJobs = await this.scheduledPostQueue.getCompleted();
    if ( postsJobsPaginationDto.type ) {
      completedJobs = completedJobs.filter( d => d.data.type === postsJobsPaginationDto.type );
    }
    return this.sortAndPaginatePostsJobs( completedJobs, page, limit );
  }

  // Remove a job
  async removeJob ( jobId: JobId, i18n: I18nContext ): Promise<Job<IScheduledPostPayload>> {
    const job = await this.scheduledPostQueue.getJob( jobId );
    if ( !job ) throw new NotFoundLocalizedException( i18n, PostsInfoLocale.TERM_POST_JOB );
    await job.remove();
    return job;
  }


  /********************************************************************************************/
  /********************************** Helper Methods ******************************************/
  /*********************************** Start Region *******************************************/
  /********************************************************************************************/

  // Add scheduled post jobs to queue
  async addScheduledPostJobToQueue ( post: Post ) {
    if ( post.status === PostStatusEnum.FUTURE ) {
      // Schedule to publish if schedule date exists
      if ( post?.scheduledToPublish ) {
        const delay = post.scheduledToPublish.getTime() - Date.now();
        await this.scheduledPostQueue.add( PostJobs.SCHEDULED_POST_TO_PUBLISH, { id: post.id, type: post.type, title: post.title, slug: post.slug, scheduledToPublish: post.scheduledToPublish }, { delay } );
      }

      // Schedule to archive if schedule date exists
      if ( post?.scheduledToArchive ) {
        const delay = post.scheduledToArchive.getTime() - Date.now();
        await this.scheduledPostQueue.add( PostJobs.SCHEDULED_POST_TO_ARCHIVE, { id: post.id, type: post.type, title: post.title, slug: post.slug, scheduledToArchive: post.scheduledToArchive }, { delay } );
      }
    }
  }

  /**
   * Sort and paginate posts queued jobs
   * @param jobs - Bull jobs of the type {@link IScheduledPostPayload}
   * @param page - Number of current page
   * @param size - Items per page
   * @returns Sorted and paginated posts jobs
   */
  sortAndPaginatePostsJobs ( jobs: Job<IScheduledPostPayload>[], page: number = 1, size: number = 10 )
    : IListResultGenerator<PostsDelayedJobs> {
    jobs.sort( ( a, b ) => parseInt( b.id.toString() ) - parseInt( a.id.toString() ) );

    const total = jobs.length;
    const totalPages = Math.ceil( total / size );

    let pageVal = 1;
    if ( page < 1 ) { pageVal = 1; }
    else if ( page > totalPages ) { pageVal = totalPages > 0 ? totalPages : 1; }
    else { pageVal = page ? page : 1; }

    let sizeVal = 10;
    if ( size < 1 ) { sizeVal = 10; }
    else if ( size > 100 ) { sizeVal = 100; }
    else { sizeVal = size ? size : 10; }

    const startIndex = ( pageVal - 1 ) * sizeVal;
    const endIndex = startIndex + sizeVal;
    const jobsSlice = jobs.slice( startIndex, endIndex );
    const currentPageResultsNumber = jobsSlice.length;

    const data = jobsSlice.map( j => {
      return {
        jobId: j.id,
        title: j.data.title,
        slug: j.data.slug,
        type: j.data.type,
        scheduledToPublish: j.data.scheduledToPublish,
        scheduledToArchive: j.data.scheduledToArchive
      };
    } );

    return {
      meta: {
        totalPages,
        currentPage: pageVal,
        itemCount: currentPageResultsNumber,
        totalItems: total,
        itemsPerPage: sizeVal,
      },
      items: data
    };
  }

  /********************************************************************************************/
  /************************************ End Region ********************************************/
  /********************************** Helper Methods ******************************************/
  /********************************************************************************************/
}
