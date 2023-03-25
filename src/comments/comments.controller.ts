import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, BadRequestException, Query } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { I18n, I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator, Metadata } from 'src/common/decorators/metadata.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { CommentsErrorsLocale } from 'src/i18n/locale-keys/comments/errors.locale';
import { SettingsService } from 'src/settings/settings.service';
import { SettingsKeyEnum } from 'src/settings/types/settings-key.enum';
import { RequirePermission } from 'src/users/decorators/require-permission.decorator';
import { JwtAuthGuard } from 'src/users/guards/jwt.guard';
import { PermissionsGuard } from 'src/users/guards/require-permissions.guard';
import { CommentsService } from './comments.service';
import { CommentQueryListDto } from './dto/comment-query-list.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UserCommentQueryListDto } from './dto/user/user-comment-query-list.dto';
import { UserCommentsListDto } from './dto/user/user-comments-list.dto';
import { UserCommentsDto } from './dto/user/user-comments.dto';
import { Comment } from './entities/comment.entity';

@Controller()
export class CommentsController {
  constructor (
    private readonly commentsService: CommentsService,
    private readonly settingsService: SettingsService
  ) { }

  /**************************** USER REGION ***********************************/

  @Throttle( 6, 60 )
  @Recaptcha( { action: 'comment' } )
  @UseGuards( JwtAuthGuard )
  @Post( 'comments' )
  @Serialize( UserCommentsDto )
  async create (
    @Body() createCommentDto: CreateCommentDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator ): Promise<Comment> {
    const maxAllowedCommentLength = +( await this.settingsService.findOne( SettingsKeyEnum.COMMENT_MAX_LENGTH ) )?.value ?? 200;
    if ( createCommentDto.content.length > maxAllowedCommentLength ) {
      throw new BadRequestException(
        i18n.t(
          CommentsErrorsLocale.MAX_ALLOWED_LENGTH,
          { args: { maxLength: maxAllowedCommentLength } }
        )
      );
    }
    return this.commentsService.create( createCommentDto, i18n, metadata );
  }

  @UseGuards( JwtAuthGuard )
  @Post( 'comments/:id/like' )
  @Serialize( UserCommentsDto )
  like ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext, @Metadata() metadata: IMetadataDecorator ): Promise<Comment> {
    return this.commentsService.like( id, i18n, metadata );
  }

  @UseGuards( JwtAuthGuard )
  @Post( 'comments/:id/dislike' )
  @Serialize( UserCommentsDto )
  dislike ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext, @Metadata() metadata: IMetadataDecorator ): Promise<Comment> {
    return this.commentsService.dislike( id, i18n, metadata );
  }

  @Get( 'comments/projects-special-comments' )
  @Serialize( UserCommentsDto )
  findAllProjectsSpecialComments (): Promise<Comment[]> {
    return this.commentsService.findAllProjectsSpecialComments();
  }

  @Get( 'comments/:postId' )
  @Serialize( UserCommentsListDto )
  findAll ( @Param( 'postId' ) postId: string, @Query() query: UserCommentQueryListDto ) {
    return this.commentsService.findAll( query, postId, true, true );
  }

  @Get( 'comments/replies/:ancestorId' )
  @Serialize( UserCommentsListDto )
  findAllCommentReplies ( @Query() query: PaginationDto, @Param( 'ancestorId' ) ancestorId: string ): Promise<IListResultGenerator<Comment>> {
    return this.commentsService.findAllCommentReplies( query, ancestorId );
  }

  /**************************** ADMIN REGION ***********************************/

  @SkipThrottle()
  @UseGuards( JwtAuthGuard )
  @Post( 'admin/comments' )
  async adminCreate (
    @Body() createCommentDto: CreateCommentDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator ): Promise<Comment> {
    return this.commentsService.create( createCommentDto, i18n, metadata );
  }

  @SkipThrottle()
  @Get( 'admin/comments' )
  adminFindAll ( @Query() query: CommentQueryListDto ): Promise<IListResultGenerator<Comment>> {
    return this.commentsService.findAll( query );
  }

  @SkipThrottle()
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_READ )
  @Get( 'admin/comments/user-replies/:parentId' )
  adminFindAllCommentRepliesByParent ( @Param( 'parentId' ) parentId: string, @Metadata() metadata: IMetadataDecorator ): Promise<Comment[]> {
    return this.commentsService.findAllCommentRepliesByParentId( parentId, metadata );
  }

  @SkipThrottle()
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_READ )
  @Get( 'admin/comments/unseen' )
  adminUnseenCommentsNum (): Promise<{ unseenNum: number; }> {
    return this.commentsService.countUnseen();
  }

  @SkipThrottle()
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_READ )
  @Get( 'admin/comments/:id' )
  adminFindOne ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.commentsService.findOne( id, i18n );
  }

  @SkipThrottle()
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_EDIT )
  @Patch( 'admin/comments/:id' )
  adminUpdate (
    @Param( 'id' ) id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator ): Promise<Comment> {
    return this.commentsService.update( id, updateCommentDto, i18n, metadata );
  }

  @SkipThrottle()
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_EDIT )
  @Patch( 'admin/comments/approve/:id' )
  adminApprove (
    @Param( 'id' ) id: string,
    @I18n() i18n: I18nContext ): Promise<Comment> {
    return this.commentsService.approve( id, i18n );
  }

  @SkipThrottle()
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_EDIT )
  @Patch( 'admin/comments/set-unset-special/:id' )
  setUnsetSpecial (
    @Param( 'id' ) id: string,
    @I18n() i18n: I18nContext ): Promise<Comment> {
    return this.commentsService.setUnsetSpecial( id, i18n );
  }

  @SkipThrottle()
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_EDIT )
  @Patch( 'admin/comments/reject/:id' )
  adminDisapprove (
    @Param( 'id' ) id: string,
    @I18n() i18n: I18nContext ): Promise<Comment> {
    return this.commentsService.reject( id, i18n );
  }

  @SkipThrottle()
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_DELETE )
  @Delete( 'admin/comments/soft-delete/:id' )
  adminSoftRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.commentsService.softRemove( id, i18n );
  }

  @SkipThrottle()
  @Delete( 'admin/comments/soft-delete-all' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_DELETE )
  adminSoftRemoveAll ( @Body( 'ids' ) ids: string[], @I18n() i18n: I18nContext ): Promise<Comment[]> {
    return this.commentsService.softRemoveAll( ids, i18n );
  }

  @SkipThrottle()
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_DELETE )
  @Patch( 'admin/comments/recover/:id' )
  adminRecover ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.commentsService.recover( id, i18n );
  }

  @SkipThrottle()
  @Patch( 'admin/comments/recover-all' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_DELETE )
  adminRecoverAll ( @Body( 'ids' ) ids: string[], @I18n() i18n: I18nContext ): Promise<Comment[]> {
    return this.commentsService.recoverAll( ids, i18n );
  }

  @SkipThrottle()
  @Get( 'admin/comments/soft-deleted/trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_DELETE )
  softRemovedFindAll ( @Query() query: PaginationDto ): Promise<IListResultGenerator<Comment>> {
    return this.commentsService.softRemovedFindAll( query );
  }

  @SkipThrottle()
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_DELETE )
  @Delete( 'admin/comments/permanent-delete/:id' )
  adminRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.commentsService.remove( id, i18n );
  }

  @SkipThrottle()
  @Delete( 'admin/comments/permanent-delete-all' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_DELETE )
  adminRemoveAll ( @Body( 'ids' ) ids: string[], @I18n() i18n: I18nContext ): Promise<Comment[]> {
    return this.commentsService.removeAll( ids, i18n );
  }

  @SkipThrottle()
  @Delete( 'admin/comments/empty-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_DELETE )
  adminEmptyTrash ( @I18n() i18n: I18nContext ): Promise<void> {
    return this.commentsService.emptyTrash( i18n );
  }
}
