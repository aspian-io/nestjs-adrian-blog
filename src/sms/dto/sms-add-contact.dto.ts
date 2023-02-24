import { IsMobilePhone, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";

export class SMSAddContactDto {
  @IsNumber( {}, { message: CommonErrorsLocale.VALIDATOR_IS_NUMBER } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  phoneBookId: number;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  name: string;

  @IsMobilePhone( null, {strictMode: false}, { message: CommonErrorsLocale.VALIDATOR_IS_MOBILE_PHONE, each: true } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  lineNumber: string;
}