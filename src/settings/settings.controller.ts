import { Controller, Get, Body, Patch, Param, Query, UseGuards, CacheTTL, Delete } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { I18n, I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator, Metadata } from 'src/common/decorators/metadata.decorator';
import { JwtAuthGuard } from 'src/users/guards/jwt.guard';
import { PermissionsGuard } from 'src/users/guards/require-permissions.guard';
import { RequirePermission } from 'src/users/decorators/require-permission.decorator';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { SettingListQueryDto } from './dto/list-query.dto';
import { SettingsKeyEnum } from './types/settings-key.enum';
import { UpsertSettingDto } from './dto/upsert-setting.dto';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
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

  @Patch( 'upsert' )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.SETTING_EDIT )
  upsert (
    @Body() upsertSettingsArray: UpsertSettingDto[],
    @Metadata() metadata: IMetadataDecorator ) {
    const upsertPromises = upsertSettingsArray.map( us => {
      return this.settingsService.upsert( us, metadata );
    } );
    return Promise.all( upsertPromises );
  }

  @Delete( 'permanent-delete/:settingKey' )
  @RequirePermission( PermissionsEnum.ADMIN )
  remove ( @I18n() i18n: I18nContext, @Param( 'settingKey' ) settingKey: SettingsKeyEnum ) {
    return this.settingsService.remove( i18n, settingKey );
  }
}
