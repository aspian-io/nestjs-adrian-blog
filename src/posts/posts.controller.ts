import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
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

@Controller()
export class PostsController {
  constructor ( private readonly postsService: PostsService ) { }

  /********************** User Region ***************************/

  @Get( '/posts/blogs' )
  @Serialize( PostDto )
  blogsList ( @Query() query: UserBlogsListDto ) {
    return this.postsService.findAll( query, PostTypeEnum.BLOG );
  }

  @Get( '/posts/blogs/:slug' )
  @Serialize( PostDto )
  blogsDetails ( @Param( 'slug' ) slug: string, @I18n() i18n: I18nContext, @Metadata() metadata: IMetadataDecorator ) {
    return this.postsService.findBySlug( slug, i18n, metadata );
  }

  @Get( '/posts/news' )
  @Serialize( PostDto )
  newsList ( @Query() query: UserBlogsListDto ) {
    return this.postsService.findAll( query, PostTypeEnum.NEWS );
  }

  @Get( '/posts/news/:slug' )
  @Serialize( PostDto )
  newsDetails ( @Param( 'slug' ) slug: string, @I18n() i18n: I18nContext, @Metadata() metadata: IMetadataDecorator ) {
    return this.postsService.findBySlug( slug, i18n, metadata );
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

  @Get( 'admin/posts/sms-birthday-templates' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  adminFindAllSMSBirthdayTemplates ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.SMS_BIRTHDAY_TEMPLATE );
  }

  @Get( 'admin/posts/sms-templates' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_READ )
  adminFindAllSMSTemplates ( @Query() query: PostsQueryListDto ): Promise<IListResultGenerator<PostEntity>> {
    return this.postsService.findAll( query, PostTypeEnum.SMS_TEMPLATE );
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

  @Delete( 'admin/posts/soft-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminSoftRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<PostEntity> {
    return this.postsService.softRemove( id, i18n );
  }

  @Patch( 'admin/posts/recover/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminRecover ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<PostEntity> {
    return this.postsService.recover( id, i18n );
  }

  @Delete( 'admin/posts/permanent-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.POST_DELETE )
  adminRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<PostEntity> {
    return this.postsService.remove( id, i18n );
  }
}
