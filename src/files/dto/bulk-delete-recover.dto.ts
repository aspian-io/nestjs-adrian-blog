import { ArrayMinSize, IsArray } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";

export class BulkDeleteRecoverDto {
  @IsArray( { message: CommonErrorsLocale.VALIDATOR_IS_ARRAY } )
  @ArrayMinSize( 1, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_ARRAY_MIN_LENGTH as any ) } )
  ids: string[];
}