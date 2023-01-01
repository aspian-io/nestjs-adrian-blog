import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CommonErrorsLocale } from 'src/i18n/locale-keys/common/errors.locale';
import { PostSlugsHistory } from '../entities/post-slug.entity';
import { PostStatusEnum, PostVisibilityEnum } from '../entities/post.entity';

export class UpdatePostDto {
  @IsIn( Object.values( PostVisibilityEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  visibility: PostVisibilityEnum;

  @IsIn( Object.values( PostStatusEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN ) } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  status: PostStatusEnum;

  @IsDate( { message: CommonErrorsLocale.VALIDATOR_IS_DATE } )
  @Type( () => Date )
  @IsOptional()
  scheduledToPublish?: Date;

  @IsDate( { message: CommonErrorsLocale.VALIDATOR_IS_DATE } )
  @Type( () => Date )
  @IsOptional()
  scheduledToArchive?: Date;

  @IsBoolean( { message: CommonErrorsLocale.VALIDATOR_IS_BOOLEAN } )
  @IsOptional()
  commentAllowed?: Boolean;

  @IsBoolean( { message: CommonErrorsLocale.VALIDATOR_IS_BOOLEAN } )
  @IsOptional()
  isPinned?: Boolean;

  @IsNumber( {}, { message: CommonErrorsLocale.VALIDATOR_IS_NUMBER } )
  @IsOptional()
  order?: number;

  @IsUUID( 'all', { message: CommonErrorsLocale.VALIDATOR_IS_UUID } )
  @IsOptional()
  parentId?: string;

  @IsArray( { message: CommonErrorsLocale.VALIDATOR_IS_ARRAY } )
  @IsOptional()
  taxonomiesIds?: string[];

  @IsArray( { message: CommonErrorsLocale.VALIDATOR_IS_ARRAY } )
  @IsOptional()
  attachmentsIds?: string[];

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  title: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  subtitle?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @MaxLength( 200, { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_MAX_LENGTH ) } )
  @IsOptional()
  excerpt?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  content?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  templateDesign?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @Matches( /^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: CommonErrorsLocale.VALIDATOR_IS_SLUG } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  slug: string;

  @IsBoolean( { message: CommonErrorsLocale.VALIDATOR_IS_BOOLEAN } )
  @IsOptional()
  storeOldSlugToRedirect?: boolean = true;

  @IsUUID( 'all', { message: CommonErrorsLocale.VALIDATOR_IS_UUID } )
  @IsOptional()
  featuredImageId?: string;

  @Type( () => PostSlugsHistory )
  @IsOptional()
  slugsHistory: PostSlugsHistory[];
}
