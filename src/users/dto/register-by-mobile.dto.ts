import { PickType } from "@nestjs/mapped-types";
import { IsEmail, IsMobilePhone, IsNotEmpty, IsOptional } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { CreateUserDto } from "./create-user.dto";

export class UserRegisterByMobileDto extends PickType( CreateUserDto, [ 'firstName', 'lastName', 'password' ] as const ) {
  @IsMobilePhone( 'fa-IR', null, { message: CommonErrorsLocale.VALIDATOR_IS_MOBILE_PHONE } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  mobilePhone: string;

  @IsEmail( {}, { message: CommonErrorsLocale.VALIDATOR_IS_EMAIL } )
  @IsOptional()
  email: string;
}