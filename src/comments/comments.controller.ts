import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, BadRequestException, Query } from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator, Metadata } from 'src/common/decorators/metadata.decorator';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
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

  @Get( 'comments/:postId' )
  @Serialize( UserCommentsListDto )
  findAll ( @Param( 'postId' ) postId: string, @Query() query: UserCommentQueryListDto ) {
    return this.commentsService.findAll( query, postId );
  }

  /**************************** ADMIN REGION ***********************************/

  @Get( 'admin/comments' )
  adminFindAll ( @Query() query: CommentQueryListDto ) {
    return this.commentsService.findAll( query );
  }

  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_READ )
  @Get( 'admin/comments/:id' )
  adminFindOne ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.commentsService.findOne( id, i18n );
  }

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

  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_DELETE )
  @Delete( 'admin/comments/soft-delete/:id' )
  adminSoftRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.commentsService.softRemove( id, i18n );
  }

  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_DELETE )
  @Patch( 'admin/comments/recover/:id' )
  adminRecover ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.commentsService.recover( id, i18n );
  }

  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_DELETE )
  @Delete( 'admin/comments/permanent-delete/:id' )
  adminRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.commentsService.remove( id, i18n );
  }
}
