import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator, Metadata } from 'src/common/decorators/metadata.decorator';
import { JwtAuthGuard } from 'src/users/guards/jwt.guard';
import { PermissionsGuard } from 'src/users/guards/require-permissions.guard';
import { RequirePermission } from 'src/users/decorators/require-permission.decorator';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { Post as PostEntity, PostTypeEnum, WidgetTypeEnum } from './entities/post.entity';
import { PostsQueryListDto } from './dto/post-query-list.dto';
import { IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { UserBlogsListDto } from './dto/user/user-blog-list.dto';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { PostDto } from './dto/user/post.dto';
import { PostListDto } from './dto/user/post-list.dto';
import { Response } from 'express';
import { PostsJobsQueryDto } from './dto/posts-jobs-query.dto';
import { PostStatisticsDto } from './dto/user/post-statistics.dto';
import { SearchDto } from './dto/user/search.dto';
import { PostSitemapDto } from './dto/user/post-sitemap.dto';
import { AdminPostListDto } from './dto/post-list.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { BannerListDto } from './dto/user/banner-list.dto';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@Controller()
export class PostsController {
  constructor (
    private readonly postsService: PostsService,
  ) { }

  /********************** User Region ***************************/

  @Throttle( 20, 60 )
  @Get( '/posts/search' )
  @Serialize( PostListDto )
  search ( @Query() query: SearchDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.search( query );
  }

  @Get( '/posts/widgets' )
  @Serialize( PostDto )
  widgetsList ( @Query( 'type' ) type: WidgetTypeEnum ) {
    return this.postsService.findAllWidgetsByType( type );
  }

  @Get( '/posts/banners' )
  @Serialize( BannerListDto )
  bannersList ( @Query() query: UserBlogsListDto ) {
    return this.postsService.findAll( query, PostTypeEnum.BANNER, false );
  }

  @Get( '/posts/blogs' )
  @Serialize( PostListDto )
  blogsList ( @Query() query: UserBlogsListDto ) {
    return this.postsService.findAll( query, PostTypeEnum.BLOG, false );
  }

  @Get( '/posts/blogs/:slug' )
  @Serialize( PostDto )
  async blogDetails (
    @Res( { passthrough: true } ) res: Response,
    @Param( 'slug' ) slug: string,
    @I18n() i18n: I18nContext ) {
    const result = await this.postsService.findBySlug( slug, i18n, PostTypeEnum.BLOG, false );
    if ( result?.redirect?.status === 301 ) {
      res.status( 301 );
      return result.post;
    }
    return result.post;
  }

  @Get( '/posts/blogs/statistics/:slug' )
  @Serialize( PostStatisticsDto )
  async blogDetailsStatistics (
    @Param( 'slug' ) slug: string,
    @I18n() i18n: I18nContext ) {
    const result = await this.postsService.findBySlug( slug, i18n, PostTypeEnum.BLOG, false );
    return result.post;
  }

  @Get( '/posts/pages' )
  @Serialize( PostListDto )
  pagesList ( @Query() query: UserBlogsListDto ) {
    return this.postsService.findAll( query, PostTypeEnum.PAGE, false );
  }

  @Get( '/posts/pages/:slug' )
  @Serialize( PostDto )
  async pageDetails (
    @Res( { passthrough: true } ) res: Response,
    @Param( 'slug' ) slug: string,
    @I18n() i18n: I18nContext ) {
    const result = await this.postsService.findBySlug( slug, i18n, PostTypeEnum.PAGE, false );
    if ( result?.redirect?.status === 301 ) {
      res.status( 301 );
      return result.post;
    }
    return result.post;
  }

  @Get( '/posts/pages/statistics/:slug' )
  @Serialize( PostStatisticsDto )
  async pageDetailsStatistics (
    @Param( 'slug' ) slug: string,
    @I18n() i18n: I18nContext ) {
    const result = await this.postsService.findBySlug( slug, i18n, PostTypeEnum.PAGE, false );
    return result.post;
  }

  @Get( '/posts/news' )
  @Serialize( PostListDto )
  newsList ( @Query() query: UserBlogsListDto ) {
    return this.postsService.findAll( query, PostTypeEnum.NEWS, false );
  }

  @Get( '/posts/news/:slug' )
  @Serialize( PostDto )
  async newsDetails (
    @Res( { passthrough: true } ) res: Response,
    @Param( 'slug' ) slug: string,
    @I18n() i18n: I18nContext ) {
    const result = await this.postsService.findBySlug( slug, i18n, PostTypeEnum.NEWS, false );
    if ( result?.redirect?.status === 301 ) {
      res.status( 301 );
      return result.post;
    }
    return result.post;
  }

  @Get( '/posts/news/statistics/:slug' )
  @Serialize( PostStatisticsDto )
  async newsDetailsStatistics (
    @Param( 'slug' ) slug: string,
    @I18n() i18n: I18nContext ) {
    const result = await this.postsService.findBySlug( slug, i18n, PostTypeEnum.NEWS, false );
    return result.post;
  }

  @Get( '/posts/projects' )
  @Serialize( PostListDto )
  projectsList ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.PROJECT, false );
  }

  @Get( '/posts/projects/:slug' )
  @Serialize( PostDto )
  async projectsDetails (
    @Res( { passthrough: true } ) res: Response,
    @Param( 'slug' ) slug: string,
    @I18n() i18n: I18nContext ) {
    const result = await this.postsService.findBySlug( slug, i18n, PostTypeEnum.PROJECT, false );
    if ( result?.redirect?.status === 301 ) {
      res.status( 301 );
      return result.post;
    }
    return result.post;
  }

  @UseGuards( JwtAuthGuard )
  @Post( 'posts/like/:postId' )
  @Serialize( PostDto )
  like ( @Param( 'postId' ) postId: string, @Metadata() metadata: IMetadataDecorator, @I18n() i18n: I18nContext ) {
    return this.postsService.like( postId, metadata, i18n );
  }

  @UseGuards( JwtAuthGuard )
  @Post( 'posts/bookmark/:postId' )
  @Serialize( PostDto )
  bookmark ( @Param( 'postId' ) postId: string, @Metadata() metadata: IMetadataDecorator, @I18n() i18n: I18nContext ) {
    return this.postsService.bookmark( postId, metadata, i18n );
  }

  @Get( 'posts/sitemap' )
  @Serialize( PostSitemapDto )
  sitemap (): Promise<PostEntity[]> {
    return this.postsService.sitemap();
  }


  /********************** Admin Region ***************************/

  @SkipThrottle()
  @Post( 'admin/posts' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_CREATE )
  adminCreate (
    @Body() createPostDto: CreatePostDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator ): Promise<PostEntity> {
    return this.postsService.create( createPostDto, i18n, metadata );
  }

  @SkipThrottle()
  @Get( 'admin/posts/recent' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  @Serialize( AdminPostListDto )
  adminFindRecentPosts ( @Query() query: PaginationDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findRecentPosts( query );
  }

  @SkipThrottle()
  @Get( 'admin/posts/widgets' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  adminFindAllWidgets ( @Query( 'type' ) type: WidgetTypeEnum ) {
    return this.postsService.findAllWidgetsByType( type );
  }

  @SkipThrottle()
  @Get( 'admin/posts/blogs' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  @Serialize( AdminPostListDto )
  adminFindAllBlogs ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.BLOG );
  }

  @SkipThrottle()
  @Get( 'admin/posts/banners' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  @Serialize( AdminPostListDto )
  adminFindAllBanners ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.BANNER );
  }

  @SkipThrottle()
  @Get( 'admin/posts/email-templates' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  @Serialize( AdminPostListDto )
  adminFindAllEmailTemplates ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.EMAIL_TEMPLATE );
  }

  @SkipThrottle()
  @Get( 'admin/posts/newsletter-templates' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  @Serialize( AdminPostListDto )
  adminFindAllNewsletterTemplates ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.NEWSLETTER_TEMPLATE );
  }

  @SkipThrottle()
  @Get( 'admin/posts/news' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  @Serialize( AdminPostListDto )
  adminFindAllNews ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.NEWS );
  }

  @SkipThrottle()
  @Get( 'admin/posts/pages' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  @Serialize( AdminPostListDto )
  adminFindAllPages ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.PAGE );
  }

  @SkipThrottle()
  @Get( 'admin/posts/projects' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  @Serialize( AdminPostListDto )
  adminFindAllProjects ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.PROJECT );
  }

  @SkipThrottle()
  @Get( 'admin/posts/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  adminFindOne ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<PostEntity> {
    return this.postsService.findOne( id, i18n );
  }

  @SkipThrottle()
  @Patch( 'admin/posts/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_EDIT )
  adminUpdate (
    @Param( 'id' ) id: string,
    @Body() updatePostDto: UpdatePostDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator
  ): Promise<PostEntity> {
    return this.postsService.update( id, updatePostDto, i18n, metadata );
  }

  @SkipThrottle()
  @Delete( 'admin/posts/delete-old-slug/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminRemoveOldSlug ( @Param( ':id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.postsService.removeOldSlug( id, i18n );
  }

  @SkipThrottle()
  @Delete( 'admin/posts/soft-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminSoftRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<PostEntity> {
    return this.postsService.softRemove( id, i18n );
  }

  @SkipThrottle()
  @Delete( 'admin/posts/soft-delete-all' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminSoftRemoveAll ( @Body( 'ids' ) ids: string[] ): Promise<PostEntity[]> {
    return this.postsService.softRemoveAll( ids );
  }
  @SkipThrottle()
  @Get( 'admin/posts/soft-deleted/blogs-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  @Serialize( AdminPostListDto )
  softRemovedFindAllBlogsTrash ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.softRemovedFindAll( query, PostTypeEnum.BLOG );
  }

  @SkipThrottle()
  @Get( 'admin/posts/soft-deleted/banners-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  @Serialize( AdminPostListDto )
  softRemovedFindAllBannersTrash ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.softRemovedFindAll( query, PostTypeEnum.BANNER );
  }

  @SkipThrottle()
  @Get( 'admin/posts/soft-deleted/email-templates-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  @Serialize( AdminPostListDto )
  softRemovedFindAllEmailTemplatesTrash ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.softRemovedFindAll( query, PostTypeEnum.EMAIL_TEMPLATE );
  }

  @SkipThrottle()
  @Get( 'admin/posts/soft-deleted/newsletter-templates-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  @Serialize( AdminPostListDto )
  softRemovedFindAllNewsletterTemplatesTrash ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.softRemovedFindAll( query, PostTypeEnum.NEWSLETTER_TEMPLATE );
  }

  @SkipThrottle()
  @Get( 'admin/posts/soft-deleted/news-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  @Serialize( AdminPostListDto )
  softRemovedFindAllNewsTrash ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.softRemovedFindAll( query, PostTypeEnum.NEWS );
  }

  @SkipThrottle()
  @Get( 'admin/posts/soft-deleted/pages-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  @Serialize( AdminPostListDto )
  softRemovedFindAllPagesTrash ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.softRemovedFindAll( query, PostTypeEnum.PAGE );
  }

  @SkipThrottle()
  @Get( 'admin/posts/soft-deleted/projects-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  @Serialize( AdminPostListDto )
  softRemovedFindAllProjectsTrash ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.softRemovedFindAll( query, PostTypeEnum.PROJECT );
  }

  @SkipThrottle()
  @Patch( 'admin/posts/recover/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminRecover ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<PostEntity> {
    return this.postsService.recover( id, i18n );
  }

  @SkipThrottle()
  @Patch( 'admin/posts/recover-all' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminRecoverAll ( @Body( 'ids' ) ids: string[] ): Promise<PostEntity[]> {
    return this.postsService.recoverAll( ids );
  }

  @SkipThrottle()
  @Delete( 'admin/posts/permanent-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<PostEntity> {
    return this.postsService.remove( id, i18n );
  }

  @SkipThrottle()
  @Delete( 'admin/posts/permanent-delete-all' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminRemoveAll ( @Body( 'ids' ) ids: string[] ): Promise<PostEntity[]> {
    return this.postsService.removeAll( ids );
  }

  @SkipThrottle()
  @Delete( 'admin/posts/empty-blogs-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminEmptyBlogsTrash (): Promise<void> {
    return this.postsService.emptyTrash( PostTypeEnum.BLOG );
  }

  @SkipThrottle()
  @Delete( 'admin/posts/empty-banners-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminEmptyBannersTrash (): Promise<void> {
    return this.postsService.emptyTrash( PostTypeEnum.BANNER );
  }

  @SkipThrottle()
  @Delete( 'admin/posts/empty-email-templates-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminEmptyEmailTemplatesTrash (): Promise<void> {
    return this.postsService.emptyTrash( PostTypeEnum.EMAIL_TEMPLATE );
  }

  @SkipThrottle()
  @Delete( 'admin/posts/empty-newsletter-templates-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminEmptyNewsletterTemplatesTrash (): Promise<void> {
    return this.postsService.emptyTrash( PostTypeEnum.NEWSLETTER_TEMPLATE );
  }

  @SkipThrottle()
  @Delete( 'admin/posts/empty-news-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminEmptyNewsTrash (): Promise<void> {
    return this.postsService.emptyTrash( PostTypeEnum.NEWS );
  }

  @SkipThrottle()
  @Delete( 'admin/posts/empty-pages-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminEmptyPagesTrash (): Promise<void> {
    return this.postsService.emptyTrash( PostTypeEnum.PAGE );
  }

  @SkipThrottle()
  @Delete( 'admin/posts/empty-projects-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminEmptyProjectsTrash (): Promise<void> {
    return this.postsService.emptyTrash( PostTypeEnum.PROJECT );
  }

  @SkipThrottle()
  @Get( 'admin/posts/posts-jobs/delayed' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  findAllDelayedJobs ( @Query() jobsPaginationDto: PostsJobsQueryDto ) {
    return this.postsService.findAllDelayedJobs( jobsPaginationDto );
  }

  @SkipThrottle()
  @Get( 'admin/posts/posts-jobs/completed' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  findAllCompletedJobs ( @Query() jobsPaginationDto: PostsJobsQueryDto ) {
    return this.postsService.findAllCompletedJobs( jobsPaginationDto );
  }

  @SkipThrottle()
  @Delete( 'admin/posts/posts-jobs/delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  removeJob ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.postsService.removeJob( id, i18n );
  }
}
