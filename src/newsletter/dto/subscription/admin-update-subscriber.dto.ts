import { PartialType } from "@nestjs/mapped-types";
import { IsBoolean, IsOptional } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { CreateSubscriberDto } from "./user/create-subscriber.dto";

export class AdminUpdateSubscriberDto extends PartialType( CreateSubscriberDto ) {
  @IsBoolean( { message: CommonErrorsLocale.VALIDATOR_IS_BOOLEAN } )
  @IsOptional()
  approved?: boolean;
}