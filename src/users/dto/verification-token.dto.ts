import { IsNotEmpty, IsNumber, Max, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";

export class UsersVerificationTokenDto {
  @IsNumber( {}, { message: CommonErrorsLocale.VALIDATOR_IS_NUMBER } )
  @Min( 100000, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MIN ) } )
  @Max( 999999, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  token: number;
}