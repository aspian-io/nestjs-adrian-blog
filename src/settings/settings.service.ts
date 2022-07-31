import { CACHE_MANAGER, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { SettingsInfoLocale } from 'src/i18n/locale-keys/settings/info.locale';
import { Repository } from 'typeorm';
import { SettingListQueryDto } from './dto/list-query.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Setting } from './entities/setting.entity';
import { SettingsKeyEnum } from './types/settings-key.enum';

@Injectable()
export class SettingsService {
  constructor (
    @InjectRepository( Setting ) private repo: Repository<Setting>,
    @Inject( CACHE_MANAGER ) private cacheManager: Cache
  ) { }

  findAll ( query: SettingListQueryDto ) {
    return this.repo.find( { relations: { updatedBy: true }, where: { service: query[ 'settingService' ] } } );
  }

  async findOne ( settingsKey: SettingsKeyEnum, i18n?: I18nContext ) {
    const cacheKey = `SETTINGS__SERVICE_LEVEL_CACHE__${ settingsKey }`;
    const cachedResult: Setting | null = await this.cacheManager.get( cacheKey );
    if ( cachedResult ) return cachedResult;

    const setting = await this.repo.findOne( { where: { key: settingsKey }, relations: { updatedBy: true } } );
    if ( !setting ) {
      if ( !i18n ) {
        throw new NotFoundException();
      }
      throw new NotFoundLocalizedException( i18n, SettingsInfoLocale.TERM_SETTING );
    };

    await this.cacheManager.set( cacheKey, setting, { ttl: 60 * 60 * 24 } );
    return setting;
  }

  async update ( settingsKey: SettingsKeyEnum, updateSettingDto: UpdateSettingDto, i18n: I18nContext, metadata: IMetadataDecorator ) {
    const setting = await this.findOne( settingsKey, i18n );
    setting.value = updateSettingDto.value;
    setting.updatedBy[ 'id' ] = metadata.user.id;
    setting.userAgent = metadata.userAgent;

    await this.cacheManager.reset();
    return this.repo.save( setting );
  }
}
