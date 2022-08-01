import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator, Metadata } from 'src/common/decorators/metadata.decorator';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { RequirePermission } from 'src/users/decorators/require-permission.decorator';
import { JwtAuthGuard } from 'src/users/guards/jwt.guard';
import { PermissionsGuard } from 'src/users/guards/require-permissions.guard';
import { CommentsService } from './comments.service';
import { CommentQueryListDto } from './dto/comment-query-list.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UserCommentQueryListDto } from './dto/user/user-comment-query-list.dto';
import { Comment } from './entities/comment.entity';

@Controller()
export class CommentsController {
  constructor ( private readonly commentsService: CommentsService ) { }

  @UseGuards( JwtAuthGuard )
  @Post( 'comments' )
  create (
    @Body() createCommentDto: CreateCommentDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator ): Promise<Comment> {
    return this.commentsService.create( createCommentDto, i18n, metadata );
  }

  @UseGuards( JwtAuthGuard )
  @Post( 'comments/:id/like' )
  like ( @Param( 'id' ) id: string, i18n: I18nContext, metadata: IMetadataDecorator ): Promise<Comment> {
    return this.commentsService.like( id, i18n, metadata );
  }

  @UseGuards( JwtAuthGuard )
  @Post( 'comments/:id/dislike' )
  dislike ( @Param( 'id' ) id: string, i18n: I18nContext, metadata: IMetadataDecorator ): Promise<Comment> {
    return this.commentsService.dislike( id, i18n, metadata );
  }

  @Get( 'comments/:postId' )
  findAll ( @Param( 'postId' ) postId: string, @Body() query: UserCommentQueryListDto ) {
    return this.commentsService.findAll( query, postId );
  }

  @Get( 'admin/comments' )
  adminFindAll ( @Body() query: CommentQueryListDto ) {
    return this.commentsService.findAll( query );
  }

  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_READ )
  @Get( 'admin/comments/:id' )
  adminFindOne ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.commentsService.findOne( id, i18n );
  }

  @UseGuards( JwtAuthGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_EDIT )
  @Patch( 'admin/comments/:id' )
  adminUpdate (
    @Param( 'id' ) id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator ): Promise<Comment> {
    return this.commentsService.update( id, updateCommentDto, i18n, metadata );
  }

  @UseGuards( JwtAuthGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_DELETE )
  @Delete( 'admin/comments/soft-delete/:id' )
  adminSoftRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.commentsService.softRemove( id, i18n );
  }

  @UseGuards( JwtAuthGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_DELETE )
  @Patch( 'admin/comments/recover/:id' )
  adminRecover ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.commentsService.recover( id, i18n );
  }

  @UseGuards( JwtAuthGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.COMMENT_DELETE )
  @Delete( ':id' )
  adminRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.commentsService.remove( id, i18n );
  }
}
