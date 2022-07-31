import { IsArray, IsOptional } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";

export class UpdateUserClaimsDto {
  @IsArray( { message: CommonErrorsLocale.VALIDATOR_IS_ARRAY } )
  @IsOptional()
  claimIds: string[];
}