import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";

export class AdminCreateSubscriberDto {
  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  name: string;

  @IsEmail( {}, { message: CommonErrorsLocale.VALIDATOR_IS_EMAIL } )
  email: string;

  @IsBoolean( { message: CommonErrorsLocale.VALIDATOR_IS_BOOLEAN } )
  @IsOptional()
  approved?: boolean;
}
