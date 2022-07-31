import { Controller, Get, Body, Patch, Param, Query, UseGuards, CacheTTL } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator, Metadata } from 'src/common/decorators/metadata.decorator';
import { JwtAuthGuard } from 'src/users/guards/jwt.guard';
import { PermissionsGuard } from 'src/users/guards/require-permissions.guard';
import { RequirePermission } from 'src/users/decorators/require-permission.decorator';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { SettingListQueryDto } from './dto/list-query.dto';
import { SettingsKeyEnum } from './types/settings-key.enum';

@Controller( 'admin/settings' )
@UseGuards( JwtAuthGuard, PermissionsGuard )
export class SettingsController {
  constructor ( private readonly settingsService: SettingsService ) { }

  @Get()
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.SETTING_READ )
  findAll ( @Query() query: SettingListQueryDto ) {
    return this.settingsService.findAll( query );
  }

  @Get( ':settingsKey' )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.SETTING_READ )
  findOne ( @Param( 'settingsKey' ) settingsKey: SettingsKeyEnum, @I18n() i18n: I18nContext ) {
    return this.settingsService.findOne( settingsKey, i18n );
  }

  @Patch( ':settingsKey' )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.SETTING_EDIT )
  update (
    @Param( 'settingsKey' ) settingsKey: SettingsKeyEnum,
    @Body() updateSettingDto: UpdateSettingDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator ) {
    return this.settingsService.update( settingsKey, updateSettingDto, i18n, metadata );
  }
}
