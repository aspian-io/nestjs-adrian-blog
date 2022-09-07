import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator, Metadata } from 'src/common/decorators/metadata.decorator';
import { JwtAuthGuard } from 'src/users/guards/jwt.guard';
import { PermissionsGuard } from 'src/users/guards/require-permissions.guard';
import { RequirePermission } from 'src/users/decorators/require-permission.decorator';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { FilesListQueryDto } from './dto/files-list-query.dto';
import { BulkDeleteRecoverDto } from './dto/bulk-delete-recover.dto';
import { IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { File } from './entities/file.entity';

@Controller()
export class FilesController {
  constructor ( private readonly filesService: FilesService ) { }

  @Post( 'admin/files' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.FILE_CREATE )
  adminCreate ( @Body() createFileDto: CreateFileDto, @I18n() i18n: I18nContext, @Metadata() metadata: IMetadataDecorator ): Promise<File> {
    return this.filesService.create( createFileDto, i18n, metadata );
  }

  @Get( 'admin/files' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.FILE_READ )
  adminFindAll ( @Query() query: FilesListQueryDto ): Promise<IListResultGenerator<File>> {
    return this.filesService.findAll( query );
  }

  @Get( 'admin/files/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.FILE_READ )
  adminFindOneById ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<File> {
    return this.filesService.findOneById( id, i18n );
  }

  @Patch( 'admin/files/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.FILE_EDIT )
  adminUpdate ( @Param( 'id' ) id: string, @Body() updateFileDto: UpdateFileDto, @I18n() i18n: I18nContext ): Promise<File> {
    return this.filesService.update( id, updateFileDto, i18n );
  }

  @Delete( 'admin/files/soft-remove/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.FILE_DELETE )
  adminSoftRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<File> {
    return this.filesService.softRemove( i18n, id );
  }

  @Patch( 'admin/files/recover/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.FILE_DELETE )
  adminRecover ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<File> {
    return this.filesService.recover( i18n, id );
  }

  @Delete( 'admin/files/permanent-remove/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.FILE_DELETE )
  adminRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<File> {
    return this.filesService.remove( i18n, id );
  }

  @Delete( 'admin/files/bulk-soft-remove' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.FILE_DELETE )
  adminBulkSoftRemove ( @Body() bulkDeleteRecoverDto: BulkDeleteRecoverDto, @I18n() i18n: I18nContext ): Promise<File[]> {
    return this.filesService.bulkSoftRemove( i18n, bulkDeleteRecoverDto.ids );
  }

  @Post( 'admin/files/bulk-recover' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.FILE_DELETE )
  adminBulkRecover ( @Body() bulkDeleteRecoverDto: BulkDeleteRecoverDto, @I18n() i18n: I18nContext ): Promise<File[]> {
    return this.filesService.bulkRecover( i18n, bulkDeleteRecoverDto.ids );
  }

  @Delete( 'admin/files/bulk-permanent-remove' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.FILE_DELETE )
  adminBulkRemove ( @Body() bulkDeleteRecoverDto: BulkDeleteRecoverDto, @I18n() i18n: I18nContext ): Promise<File[]> {
    return this.filesService.bulkRemove( i18n, bulkDeleteRecoverDto.ids );
  }

  @Post( 'admin/files/config-cors' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN )
  @HttpCode(HttpStatus.OK)
  async adminConfigCORS () {
    return this.filesService.configS3CORS();
  }
}
