import { IsNotEmpty, IsString } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";

export class UserLoginDto {
  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  username: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  password: string;
}