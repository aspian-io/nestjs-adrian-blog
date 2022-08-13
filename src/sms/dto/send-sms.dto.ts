import { IsMobilePhone, IsNotEmpty, IsPhoneNumber, IsString } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";

export class SendSMSDto {
  @IsPhoneNumber( null, { message: CommonErrorsLocale.VALIDATOR_IS_PHONE_NUMBER } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  originator: string;

  @IsMobilePhone( null, { message: CommonErrorsLocale.VALIDATOR_IS_MOBILE_PHONE }, { each: true } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  recipients: string[];

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  message: string;
}