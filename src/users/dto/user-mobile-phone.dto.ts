import { IsMobilePhone, IsNotEmpty } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";

export class UserMobilePhoneDto {
  @IsMobilePhone( 'fa-IR', {}, { message: CommonErrorsLocale.VALIDATOR_IS_MOBILE_PHONE } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  mobilePhone: string;
}