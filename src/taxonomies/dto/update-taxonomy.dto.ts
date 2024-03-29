import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, ValidateNested } from 'class-validator';
import { CommonErrorsLocale } from 'src/i18n/locale-keys/common/errors.locale';

export class UpdateTaxonomyDto {
  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  href?: string;

  @IsUUID( 'all', { message: CommonErrorsLocale.VALIDATOR_IS_UUID } )
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
