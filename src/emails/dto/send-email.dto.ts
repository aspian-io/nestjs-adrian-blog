import { Transform } from "class-transformer";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { QueryStringUtil } from "src/common/utils/query-string.utils";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { EmailPriorityEnum } from "../entities/email.entity";

export class SendEmailDto {
  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  from: string;

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedStrings( value ) )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  to: string[];

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  subject: string;

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedStrings( value ) )
  @IsOptional()
  cc?: string[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedStrings( value ) )
  @IsOptional()
  bcc?: string[];

  @IsString()
  @IsOptional()
  replyTo?: string;

  @IsIn( Object.values( EmailPriorityEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN ) } )
  @IsOptional()
  priority?: EmailPriorityEnum = EmailPriorityEnum.NORMAL;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  html: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  templateDesign: string;
}


