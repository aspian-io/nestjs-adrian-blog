import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TaxonomiesService } from './taxonomies.service';
import { CreateTaxonomyDto } from './dto/create-taxonomy.dto';
import { UpdateTaxonomyDto } from './dto/update-taxonomy.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator, Metadata } from 'src/common/decorators/metadata.decorator';
import { Taxonomy, TaxonomyTypeEnum } from './entities/taxonomy.entity';
import { JwtAuthGuard } from 'src/users/guards/jwt.guard';
import { PermissionsGuard } from 'src/users/guards/require-permissions.guard';
import { RequirePermission } from 'src/users/decorators/require-permission.decorator';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { TaxonomiesListQueryDto } from './dto/taxonomy-list-query.dto';
import { IListResultGenerator } from 'src/common/utils/filter-pagination.utils';

@Controller()
export class TaxonomiesController {
  constructor ( private readonly taxonomiesService: TaxonomiesService ) { }

  @Post( 'admin/taxonomies' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_CREATE )
  adminCreate (
    @Body() createTaxonomyDto: CreateTaxonomyDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator ): Promise<Taxonomy> {
    return this.taxonomiesService.create( createTaxonomyDto, i18n, metadata );
  }

  @Get( 'admin/taxonomies/categories' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_READ )
  adminFindAllCategories ( @Query() query: TaxonomiesListQueryDto ): Promise<IListResultGenerator<Taxonomy>> {
    return this.taxonomiesService.findAll( query, TaxonomyTypeEnum.CATEGORY );
  }

  @Get( 'admin/taxonomies/tags' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_READ )
  adminFindAllTags ( @Query() query: TaxonomiesListQueryDto ): Promise<IListResultGenerator<Taxonomy>> {
    return this.taxonomiesService.findAll( query, TaxonomyTypeEnum.TAG );
  }

  @Get( 'admin/taxonomies/menus' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_READ )
  adminFindAllMenus ( @Query() query: TaxonomiesListQueryDto ): Promise<IListResultGenerator<Taxonomy>> {
    return this.taxonomiesService.findAll( query, TaxonomyTypeEnum.MENU );
  }

  @Get( 'admin/taxonomies/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_READ )
  adminFindOne ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<Taxonomy> {
    return this.taxonomiesService.findOne( id, i18n );
  }

  @Patch( 'admin/taxonomies/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_EDIT )
  adminUpdate (
    @Param( 'id' ) id: string,
    @Body() updateTaxonomyDto: UpdateTaxonomyDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator ): Promise<Taxonomy> {
    return this.taxonomiesService.update( id, updateTaxonomyDto, i18n, metadata );
  }

  @Delete( 'admin/taxonomies/soft-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  adminSoftRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<Taxonomy> {
    return this.taxonomiesService.softRemove( id, i18n );
  }

  @Patch( 'admin/taxonomies/recover/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  adminRecover ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<Taxonomy> {
    return this.taxonomiesService.recover( id, i18n );
  }

  @Delete( 'admin/taxonomies/permanent-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  adminRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<Taxonomy> {
    return this.taxonomiesService.remove( id, i18n );
  }
}
