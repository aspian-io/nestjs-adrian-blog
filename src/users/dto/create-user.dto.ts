import { Type } from "class-transformer";
import { IsDate, IsEmail, IsIn, IsMobilePhone, IsNotEmpty, IsOptional, IsPhoneNumber, IsPostalCode, IsString, Matches, MaxLength, MinLength, ValidateIf } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { GenderEnum } from "src/users/entities/user.entity";

export class CreateUserDto {
  @IsEmail( {}, { message: CommonErrorsLocale.VALIDATOR_IS_EMAIL } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  email: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MinLength( 6, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MIN_LENGTH as any ) } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @Matches( /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: CommonErrorsLocale.VALIDATOR_WEAK_PASSWORD } )
  password: string;

  @IsDate( { message: CommonErrorsLocale.VALIDATOR_IS_DATE } )
  @Type( () => Date )
  @IsOptional()
  birthDate?: Date;

  @IsIn( Object.values( GenderEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN as any ) } )
  @IsOptional()
  gender?: GenderEnum;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any) } )
  @IsOptional()
  country?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsOptional()
  state?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsOptional()
  city?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 100, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsOptional()
  address?: string;

  @IsPhoneNumber( 'IR', { message: CommonErrorsLocale.VALIDATOR_IS_PHONE_NUMBER } )
  @ValidateIf( e => e.phone !== '' )
  @IsOptional()
  phone?: string;

  @IsMobilePhone( 'fa-IR', null, { message: CommonErrorsLocale.VALIDATOR_IS_MOBILE_PHONE } )
  @ValidateIf( e => e.mobilePhone !== '' )
  @IsOptional()
  mobilePhone?: string;

  @IsPostalCode( 'any', { message: CommonErrorsLocale.VALIDATOR_IS_POSTAL_CODE } )
  @ValidateIf( e => e.postalCode !== '' )
  @IsOptional()
  postalCode?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  firstName: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 30, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  lastName: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 400, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsOptional()
  bio?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsOptional()
  website?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsOptional()
  facebook?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsOptional()
  twitter?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsOptional()
  instagram?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsOptional()
  linkedIn?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsOptional()
  pinterest?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsOptional()
  github?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 50, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH as any ) } )
  @IsOptional()
  stackoverflow?: string;
}

