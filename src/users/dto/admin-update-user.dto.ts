import { PartialType } from "@nestjs/mapped-types";
import { IsBoolean, IsDateString, IsOptional } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { CreateUserDto } from "./create-user.dto";

export class AdminUpdateUserDto extends PartialType( CreateUserDto ) {
  @IsDateString( { message: CommonErrorsLocale.VALIDATOR_IS_DATE } )
  @IsOptional()
  suspend?: Date;

  @IsBoolean( { message: CommonErrorsLocale.VALIDATOR_IS_BOOLEAN } )
  @IsOptional()
  emailVerified?: boolean;

  @IsBoolean( { message: CommonErrorsLocale.VALIDATOR_IS_BOOLEAN } )
  @IsOptional()
  mobilePhoneVerified?: boolean;
}