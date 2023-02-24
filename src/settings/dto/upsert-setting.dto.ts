import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { SettingsKeyEnum } from "../types/settings-key.enum";
import { SettingsServiceEnum } from "../types/settings-service.enum";

export class UpsertSettingDto {
  @IsIn( Object.values( SettingsKeyEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN as any ) } )
  key: SettingsKeyEnum;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  value?: string;

  @IsIn( Object.values( SettingsServiceEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN as any ) } )
  service: SettingsServiceEnum;
}
