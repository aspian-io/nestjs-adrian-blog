import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";

export class NewsletterCreateCampaignDto {
  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  name: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  description?: string;

  @IsDate( { message: CommonErrorsLocale.VALIDATOR_IS_DATE } )
  @Type( () => Date )
  @IsOptional()
  sendingTime?: Date;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  emailSubject: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  content: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  templateDesign: string;

  @IsBoolean( { message: CommonErrorsLocale.VALIDATOR_IS_BOOLEAN } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  sendToSubscribers: boolean;

  @IsBoolean( { message: CommonErrorsLocale.VALIDATOR_IS_BOOLEAN } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  sendToUsers: boolean;
}