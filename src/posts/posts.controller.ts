import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Res } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator, Metadata } from 'src/common/decorators/metadata.decorator';
import { JwtAuthGuard } from 'src/users/guards/jwt.guard';
import { PermissionsGuard } from 'src/users/guards/require-permissions.guard';
import { RequirePermission } from 'src/users/decorators/require-permission.decorator';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { Post as PostEntity, PostTypeEnum } from './entities/post.entity';
import { PostsQueryListDto } from './dto/post-query-list.dto';
import { IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { UserBlogsListDto } from './dto/user/user-blog-list.dto';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { PostDto } from './dto/user/post.dto';
import { PostListDto } from './dto/user/post-list.dto';
import { Response } from 'express';
import { PostsJobsQueryDto } from './dto/posts-jobs-query.dto';

@Controller()
export class PostsController {
  constructor (
    private readonly postsService: PostsService,
  ) { }

  /********************** User Region ***************************/

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


  /********************** Admin Region ***************************/

  @Post( 'admin/posts' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_CREATE )
  adminCreate (
    @Body() createPostDto: CreatePostDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator ): Promise<PostEntity> {
    return this.postsService.create( createPostDto, i18n, metadata );
  }

  @Get( 'admin/posts/blogs' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  adminFindAllBlogs ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.BLOG );
  }

  @Get( 'admin/posts/banners' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  adminFindAllBanners ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.BANNER );
  }

  @Get( 'admin/posts/email-templates' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  adminFindAllEmailTemplates ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.EMAIL_TEMPLATE );
  }

  @Get( 'admin/posts/news' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  adminFindAllNews ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.NEWS );
  }

  @Get( 'admin/posts/newsletter-headers' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  adminFindAllNewsletterHeaders ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.NEWSLETTER_HEADER_TEMPLATE );
  }

  @Get( 'admin/posts/newsletter-bodies' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  adminFindAllNewsletterBodies ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.NEWSLETTER_BODY_TEMPLATE );
  }

  @Get( 'admin/posts/newsletter-footers' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  adminFindAllNewsletterFooters ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.NEWSLETTER_FOOTER_TEMPLATE );
  }

  @Get( 'admin/posts/pages' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  adminFindAllPages ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.PAGE );
  }

  @Get( 'admin/posts/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  adminFindOne ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<PostEntity> {
    return this.postsService.findOne( id, i18n );
  }

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

  @Delete( 'admin/posts/delete-old-slug/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminRemoveOldSlug ( @Param( ':id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.postsService.removeOldSlug( id, i18n );
  }

  @Delete( 'admin/posts/soft-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminSoftRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<PostEntity> {
    return this.postsService.softRemove( id, i18n );
  }

  @Delete( 'admin/posts/soft-delete-all' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminSoftRemoveAll ( @Body( 'ids' ) ids: string[] ): Promise<PostEntity[]> {
    return this.postsService.softRemoveAll( ids );
  }

  @Get( 'admin/posts/soft-deleted/blogs-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  softRemovedFindAllBlogsTrash ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.softRemovedFindAll( query, PostTypeEnum.BLOG );
  }

  @Get( 'admin/posts/soft-deleted/banners-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  softRemovedFindAllBannersTrash ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.softRemovedFindAll( query, PostTypeEnum.BANNER );
  }

  @Get( 'admin/posts/soft-deleted/email-templates-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  softRemovedFindAllEmailTemplatesTrash ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.softRemovedFindAll( query, PostTypeEnum.EMAIL_TEMPLATE );
  }

  @Get( 'admin/posts/soft-deleted/news-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  softRemovedFindAllNewsTrash ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.softRemovedFindAll( query, PostTypeEnum.NEWS );
  }

  @Get( 'admin/posts/soft-deleted/newsletter-headers-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  softRemovedFindAllNewsletterHeadersTrash ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.softRemovedFindAll( query, PostTypeEnum.NEWSLETTER_HEADER_TEMPLATE );
  }

  @Get( 'admin/posts/soft-deleted/newsletter-bodies-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  softRemovedFindAllNewsletterBodiesTrash ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.softRemovedFindAll( query, PostTypeEnum.NEWSLETTER_BODY_TEMPLATE );
  }

  @Get( 'admin/posts/soft-deleted/newsletter-footers-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  softRemovedFindAllNewsletterFootersTrash ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.softRemovedFindAll( query, PostTypeEnum.NEWSLETTER_FOOTER_TEMPLATE );
  }

  @Get( 'admin/posts/soft-deleted/pages-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  softRemovedFindAllPagesTrash ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.softRemovedFindAll( query, PostTypeEnum.PAGE );
  }

  @Patch( 'admin/posts/recover/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminRecover ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<PostEntity> {
    return this.postsService.recover( id, i18n );
  }

  @Patch( 'admin/posts/recover-all' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminRecoverAll ( @Body( 'ids' ) ids: string[] ): Promise<PostEntity[]> {
    return this.postsService.recoverAll( ids );
  }

  @Delete( 'admin/posts/permanent-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<PostEntity> {
    return this.postsService.remove( id, i18n );
  }

  @Delete( 'admin/posts/permanent-delete-all' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminRemoveAll ( @Body( 'ids' ) ids: string[] ): Promise<PostEntity[]> {
    return this.postsService.removeAll( ids );
  }

  @Delete( 'admin/posts/empty-blogs-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminEmptyBlogsTrash (): Promise<void> {
    return this.postsService.emptyTrash( PostTypeEnum.BLOG );
  }

  @Delete( 'admin/posts/empty-banners-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminEmptyBannersTrash (): Promise<void> {
    return this.postsService.emptyTrash( PostTypeEnum.BANNER );
  }

  @Delete( 'admin/posts/empty-email-templates-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminEmptyEmailTemplatesTrash (): Promise<void> {
    return this.postsService.emptyTrash( PostTypeEnum.EMAIL_TEMPLATE );
  }

  @Delete( 'admin/posts/empty-news-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminEmptyNewsTrash (): Promise<void> {
    return this.postsService.emptyTrash( PostTypeEnum.NEWS );
  }

  @Delete( 'admin/posts/empty-newsletter-headers-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminEmptyNewsletterHeadersTrash (): Promise<void> {
    return this.postsService.emptyTrash( PostTypeEnum.NEWSLETTER_BODY_TEMPLATE );
  }

  @Delete( 'admin/posts/empty-newsletter-bodies-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminEmptyNewsletterBodiesTrash (): Promise<void> {
    return this.postsService.emptyTrash( PostTypeEnum.NEWSLETTER_BODY_TEMPLATE );
  }

  @Delete( 'admin/posts/empty-newsletter-footers-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminEmptyNewsletterFootersTrash (): Promise<void> {
    return this.postsService.emptyTrash( PostTypeEnum.NEWSLETTER_FOOTER_TEMPLATE );
  }

  @Delete( 'admin/posts/empty-pages-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminEmptyPagesTrash (): Promise<void> {
    return this.postsService.emptyTrash( PostTypeEnum.PAGE );
  }

  @Get( 'admin/posts/posts-jobs/delayed' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  findAllDelayedJobs ( @Query() jobsPaginationDto: PostsJobsQueryDto ) {
    return this.postsService.findAllDelayedJobs( jobsPaginationDto );
  }

  @Get( 'admin/posts/posts-jobs/completed' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  findAllCompletedJobs ( @Query() jobsPaginationDto: PostsJobsQueryDto ) {
    return this.postsService.findAllCompletedJobs( jobsPaginationDto );
  }

  @Delete( 'admin/posts/posts-jobs/delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  removeJob ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.postsService.removeJob( id, i18n );
  }
}
