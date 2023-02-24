import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";

export class UserLoginDto {
  @IsEmail( {}, { message: CommonErrorsLocale.VALIDATOR_IS_EMAIL } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  username: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MinLength( 6, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MIN_LENGTH as any ) } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  password: string;
}