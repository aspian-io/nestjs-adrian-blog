import { Type } from "class-transformer";
import { IsDate, IsEmail, IsIn, IsMobilePhone, IsNotEmpty, IsOptional, IsPhoneNumber, IsPostalCode, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { GenderEnum } from "src/users/entities/user.entity";

export class CreateUserDto {
  @IsEmail( {}, { message: CommonErrorsLocale.VALIDATOR_IS_EMAIL } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  email: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MinLength( 6, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MIN_LENGTH ) } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @Matches( /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: CommonErrorsLocale.VALIDATOR_WEAK_PASSWORD } )
  password: string;

  @IsDate( { message: CommonErrorsLocale.VALIDATOR_IS_DATE } )
  @Type( () => Date )
  @IsOptional()
  birthDate?: Date;

  @IsIn( Object.values( GenderEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN ) } )
  @IsOptional()
  gender?: GenderEnum;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  country?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  state?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  city?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 100, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  address?: string;

  @IsPhoneNumber( 'IR', { message: CommonErrorsLocale.VALIDATOR_IS_PHONE_NUMBER } )
  @IsOptional()
  phone?: string;

  @IsMobilePhone( 'fa-IR', null, { message: CommonErrorsLocale.VALIDATOR_IS_MOBILE_PHONE } )
  @IsOptional()
  mobilePhone?: string;

  @IsPostalCode( 'any', { message: CommonErrorsLocale.VALIDATOR_IS_POSTAL_CODE } )
  @IsOptional()
  postalCode?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  firstName: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  lastName: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 400, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  bio?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  website?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  facebook?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  twitter?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  instagram?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  linkedIn?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  pinterest?: string;
}

