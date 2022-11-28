import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { TaxonomyTypeEnum } from "../entities/taxonomy.entity";

export class CreateTaxonomyDto {
  @IsIn( Object.values( TaxonomyTypeEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  type: TaxonomyTypeEnum;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  href?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  parentId?: string;

  @IsNumber( {}, { message: CommonErrorsLocale.VALIDATOR_IS_NUMBER } )
  @IsOptional()
  order?: number;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  term: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @Matches( /^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: CommonErrorsLocale.VALIDATOR_IS_SLUG } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  slug: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  featuredImage?: string;
}
