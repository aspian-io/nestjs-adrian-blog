import { PickType } from "@nestjs/mapped-types";
import { IsNotEmpty, IsString } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { CreateUserDto } from "./create-user.dto";

export class UserChangePasswordDto extends PickType( CreateUserDto, [ 'password' ] ) {
  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  currentPassword: string;
}