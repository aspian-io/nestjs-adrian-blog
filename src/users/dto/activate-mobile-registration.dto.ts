import { IsMobilePhone, IsNotEmpty } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { UsersVerificationTokenDto } from "./verification-token.dto";

export class UserActivateMobileRegistrationDto extends UsersVerificationTokenDto {
  @IsMobilePhone( 'fa-IR', null, { message: CommonErrorsLocale.VALIDATOR_IS_MOBILE_PHONE } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  mobilePhone: string;
}