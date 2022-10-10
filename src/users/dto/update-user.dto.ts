import { OmitType, PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto extends PartialType( OmitType( CreateUserDto, [ 'email', 'password', 'firstName', 'lastName' ] as const ) ) {
  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  firstName: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  lastName: string;
}
