import { Transform } from "class-transformer";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { QueryStringUtil } from "src/common/utils/query-string.utils";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";

export enum EmailPriorityEnum {
  HIGH = "high",
  LOW = "low",
  NORMAL = "normal"
}

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

  @IsIn( Object.values( EmailPriorityEnum ) )
  @IsOptional()
  priority?: EmailPriorityEnum = EmailPriorityEnum.NORMAL;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  html: string;
}


