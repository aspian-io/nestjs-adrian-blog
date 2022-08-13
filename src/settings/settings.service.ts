import { BadRequestException, CACHE_MANAGER, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { SettingsErrorsLocal } from 'src/i18n/locale-keys/settings/errors.locale';
import { SettingsInfoLocale } from 'src/i18n/locale-keys/settings/info.locale';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { SettingListQueryDto } from './dto/list-query.dto';
import { UpsertSettingDto } from './dto/upsert-setting.dto';
import { Setting } from './entities/setting.entity';
import { SettingsKeyEnum } from './types/settings-key.enum';

@Injectable()
export class SettingsService {
  constructor (
    @InjectRepository( Setting ) private repo: Repository<Setting>,
    @Inject( CACHE_MANAGER ) private cacheManager: Cache
  ) { }

  // Find all settings
  findAll ( query: SettingListQueryDto ) {
    return this.repo.find( { relations: { updatedBy: true }, where: { service: query[ 'settingService' ] } } );
  }

  // Find one setting or fail
  async findOne ( settingsKey: SettingsKeyEnum, i18n?: I18nContext ) {
    const cacheKey = `SETTINGS__SERVICE_LEVEL_CACHE__${ settingsKey }`;
    const cachedResult: Setting | null = await this.cacheManager.get( cacheKey );
    if ( cachedResult ) return cachedResult;

    const setting = await this.repo.findOne( { where: { key: settingsKey }, relations: { createdBy: true, updatedBy: true } } );
    if ( !setting ) {
      if ( !i18n ) {
        throw new NotFoundException();
      }
      throw new NotFoundLocalizedException( i18n, SettingsInfoLocale.TERM_SETTING );
    };

    await this.cacheManager.set( cacheKey, setting, { ttl: 60 * 60 * 24 } );
    return setting;
  }

  // Find one setting or null
  async findOneOrNull ( settingsKey: SettingsKeyEnum ) {
    return this.repo.findOne( { where: { key: settingsKey }, relations: { createdBy: true, updatedBy: true } } );
  }

  // Upsert a setting
  async upsert ( upsertSettingDto: UpsertSettingDto, i18n: I18nContext, metadata: IMetadataDecorator ) {
    if ( upsertSettingDto.id ) {
      const setting = await this.repo.findOne( {
        where: { id: upsertSettingDto.id }
      } );
      if ( setting && setting.key !== upsertSettingDto.key ) {
        throw new BadRequestException( i18n.t( SettingsErrorsLocal.ID_KEY_NOT_MATCH ) );
      }

      setting.value = upsertSettingDto.value;
      setting.updatedBy = { id: metadata.user.id } as User;
      setting.ipAddress = metadata.ipAddress;
      setting.userAgent = metadata.userAgent;
      const updateResult = await this.repo.save( setting );
      await this.cacheManager.reset();
      return updateResult;
    }
    const settingObj = this.repo.create( {
      key: upsertSettingDto.key,
      value: upsertSettingDto.value,
      service: upsertSettingDto.service,
      createdBy: { id: metadata.user.id },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    } );
    const createResult = await this.repo.save( settingObj );
    await this.cacheManager.reset();
    return createResult;
  }
}
