import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Res } from '@nestjs/common';
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
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { TaxonomyDto } from './dto/taxonomy.dto';
import { Response } from 'express';
import { TaxonomySlugsHistory } from './entities/taxonomy-slug.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SettingsService } from 'src/settings/settings.service';
import { SettingsKeyEnum } from 'src/settings/types/settings-key.enum';
import { TaxonomyListDto } from './dto/taxonomy-list.dto';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
export class TaxonomiesController {
  constructor (
    private readonly taxonomiesService: TaxonomiesService,
    private readonly settingsService: SettingsService
  ) { }

  /********************** User Region ***************************/

  @Get( 'taxonomies/menu-items/:slug' )
  @Serialize( TaxonomyDto )
  async menuItemDetails (
    @Res( { passthrough: true } ) res: Response,
    @Param( 'slug' ) slug: string,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.taxonomiesService.findBySlug( slug, i18n, TaxonomyTypeEnum.MENU_ITEM );
    if ( result?.redirect?.status === 301 ) {
      res.status( 301 );
      return result.taxonomy;
    }
    return result.taxonomy;
  }

  @Get( 'taxonomies/project-categories' )
  @Serialize( TaxonomyListDto )
  findAllProjectCategories ( @Query() query: TaxonomiesListQueryDto ): Promise<IListResultGenerator<Taxonomy>> {
    return this.taxonomiesService.findAll( query, TaxonomyTypeEnum.PROJECT_CATEGORY );
  }

  @Get( 'taxonomies/categories/:slug' )
  @Serialize( TaxonomyDto )
  async categoriesDetails (
    @Res( { passthrough: true } ) res: Response,
    @Param( 'slug' ) slug: string,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.taxonomiesService.findBySlug( slug, i18n, TaxonomyTypeEnum.CATEGORY );
    if ( result?.redirect?.status === 301 ) {
      res.status( 301 );
      return result.taxonomy;
    }
    return result.taxonomy;
  }

  @Get( 'taxonomies/tags/:slug' )
  @Serialize( TaxonomyDto )
  async tagsDetails (
    @Res( { passthrough: true } ) res: Response,
    @Param( 'slug' ) slug: string,
    @I18n() i18n: I18nContext
  ) {
    const result = await this.taxonomiesService.findBySlug( slug, i18n, TaxonomyTypeEnum.TAG );
    if ( result?.redirect?.status === 301 ) {
      res.status( 301 );
      return result.taxonomy;
    }
    return result.taxonomy;
  }

  @Get( 'taxonomies/menus/primary-menu' )
  @Serialize( TaxonomyDto )
  async primaryMenu (): Promise<Taxonomy[]> {
    const primaryMenu = await this.settingsService.findOneOrNull( SettingsKeyEnum.MENU_PRIMARY );
    if ( !primaryMenu ) return [];
    return this.taxonomiesService.findAllMenuItems( primaryMenu.value );
  }

  @Get( 'taxonomies/menus/secondary-menu' )
  @Serialize( TaxonomyDto )
  async secondaryMenu (): Promise<Taxonomy[]> {
    const secondaryMenu = await this.settingsService.findOneOrNull( SettingsKeyEnum.MENU_SECONDARY );
    if ( !secondaryMenu ) return [];
    return this.taxonomiesService.findAllMenuItems( secondaryMenu.value );
  }


  /********************** Admin Region ***************************/

  @SkipThrottle()
  @Post( 'admin/taxonomies' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_CREATE )
  adminCreate (
    @Body() createTaxonomyDto: CreateTaxonomyDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator ): Promise<Taxonomy> {
    return this.taxonomiesService.create( createTaxonomyDto, i18n, metadata );
  }

  @SkipThrottle()
  @Get( 'admin/taxonomies/categories' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_READ )
  adminFindAllCategories ( @Query() query: TaxonomiesListQueryDto ): Promise<IListResultGenerator<Taxonomy>> {
    return this.taxonomiesService.findAll( query, TaxonomyTypeEnum.CATEGORY );
  }

  @SkipThrottle()
  @Get( 'admin/taxonomies/project-categories' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_READ )
  adminFindAllProjectCategories ( @Query() query: TaxonomiesListQueryDto ): Promise<IListResultGenerator<Taxonomy>> {
    return this.taxonomiesService.findAll( query, TaxonomyTypeEnum.PROJECT_CATEGORY );
  }

  @SkipThrottle()
  @Get( 'admin/taxonomies/tags' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_READ )
  adminFindAllTags ( @Query() query: TaxonomiesListQueryDto ): Promise<IListResultGenerator<Taxonomy>> {
    return this.taxonomiesService.findAll( query, TaxonomyTypeEnum.TAG );
  }

  @SkipThrottle()
  @Get( 'admin/taxonomies/menus' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_READ )
  adminFindAllMenus ( @Query() query: TaxonomiesListQueryDto ): Promise<IListResultGenerator<Taxonomy>> {
    return this.taxonomiesService.findAll( query, TaxonomyTypeEnum.MENU );
  }

  @SkipThrottle()
  @Get( 'admin/taxonomies/menu-items/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_READ )
  adminFindAllMenuItems ( @Param( 'id' ) id: string ): Promise<Taxonomy[]> {
    return this.taxonomiesService.findAllMenuItems( id );
  }

  @SkipThrottle()
  @Get( 'admin/taxonomies/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_READ )
  adminFindOne ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<Taxonomy> {
    return this.taxonomiesService.findOne( id, i18n );
  }

  @SkipThrottle()
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

  @SkipThrottle()
  @Delete( 'admin/taxonomies/soft-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  adminSoftRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<Taxonomy> {
    return this.taxonomiesService.softRemove( id, i18n );
  }

  @SkipThrottle()
  @Delete( 'admin/taxonomies/soft-delete-all' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  adminSoftRemoveAll ( @Body( 'ids' ) ids: string[] ): Promise<Taxonomy[]> {
    return this.taxonomiesService.softRemoveAll( ids );
  }

  @SkipThrottle()
  @Patch( 'admin/taxonomies/recover/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  adminRecover ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<Taxonomy> {
    return this.taxonomiesService.recover( id, i18n );
  }

  @SkipThrottle()
  @Patch( 'admin/taxonomies/recover-all' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  adminRecoverAll ( @Body( 'ids' ) ids: string[] ): Promise<Taxonomy[]> {
    return this.taxonomiesService.recoverAll( ids );
  }

  @SkipThrottle()
  @Get( 'admin/taxonomies/soft-deleted/categories-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  softRemovedFindAllCategoriesTrash ( @Query() query: PaginationDto ): Promise<IListResultGenerator<Taxonomy>> {
    return this.taxonomiesService.softRemovedFindAll( query, TaxonomyTypeEnum.CATEGORY );
  }

  @SkipThrottle()
  @Get( 'admin/taxonomies/soft-deleted/project-categories-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  softRemovedFindAllProjectCategoriesTrash ( @Query() query: PaginationDto ): Promise<IListResultGenerator<Taxonomy>> {
    return this.taxonomiesService.softRemovedFindAll( query, TaxonomyTypeEnum.PROJECT_CATEGORY );
  }

  @SkipThrottle()
  @Get( 'admin/taxonomies/soft-deleted/tags-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  softRemovedFindAllTagsTrash ( @Query() query: PaginationDto ): Promise<IListResultGenerator<Taxonomy>> {
    return this.taxonomiesService.softRemovedFindAll( query, TaxonomyTypeEnum.TAG );
  }

  @SkipThrottle()
  @Get( 'admin/taxonomies/soft-deleted/menus-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  softRemovedFindAllMenusTrash ( @Query() query: PaginationDto ): Promise<IListResultGenerator<Taxonomy>> {
    return this.taxonomiesService.softRemovedFindAll( query, TaxonomyTypeEnum.MENU );
  }

  @SkipThrottle()
  @Delete( 'admin/taxonomies/permanent-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  adminRemove ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<Taxonomy> {
    return this.taxonomiesService.remove( id, i18n );
  }

  @SkipThrottle()
  @Delete( 'admin/taxonomies/permanent-delete-all' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  adminRemoveAll ( @Body( 'ids' ) ids: string[] ): Promise<Taxonomy[]> {
    return this.taxonomiesService.removeAll( ids );
  }

  @SkipThrottle()
  @Delete( 'admin/taxonomies/empty-categories-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  adminEmptyCategoriesTrash (): Promise<void> {
    return this.taxonomiesService.emptyTrash( TaxonomyTypeEnum.CATEGORY );
  }

  @SkipThrottle()
  @Delete( 'admin/taxonomies/empty-project-categories-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  adminEmptyProjectCategoriesTrash (): Promise<void> {
    return this.taxonomiesService.emptyTrash( TaxonomyTypeEnum.PROJECT_CATEGORY );
  }

  @SkipThrottle()
  @Delete( 'admin/taxonomies/empty-tags-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  adminEmptyTagsTrash (): Promise<void> {
    return this.taxonomiesService.emptyTrash( TaxonomyTypeEnum.TAG );
  }

  @SkipThrottle()
  @Delete( 'admin/taxonomies/empty-menus-trash' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  adminEmptyMenusTrash (): Promise<void> {
    return this.taxonomiesService.emptyTrash( TaxonomyTypeEnum.MENU );
  }

  @SkipThrottle()
  @Delete( 'admin/taxonomies/slug-history/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.TAXONOMY_DELETE )
  adminRemoveOldSlug ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<TaxonomySlugsHistory> {
    return this.taxonomiesService.removeOldSlug( id, i18n );
  }
}
