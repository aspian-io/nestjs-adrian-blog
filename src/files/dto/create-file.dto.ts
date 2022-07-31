import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";
import { FilePolicyEnum, FileSectionEnum, FileStatus, ImageSizeCategories } from "../entities/file.entity";

export class CreateFileDto {
  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty()
  key: string;

  @IsIn( Object.values( FilePolicyEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN ) } )
  @IsNotEmpty()
  policy: FilePolicyEnum;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty()
  filename: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty()
  type: string;

  @IsNumber( {}, { message: CommonErrorsLocale.VALIDATOR_IS_NUMBER } )
  @IsNotEmpty()
  size: number;

  @IsIn( Object.values( FileSectionEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN ) } )
  @IsNotEmpty()
  section: FileSectionEnum;

  @IsIn( Object.values( ImageSizeCategories ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN ) } )
  @IsOptional()
  imageSizeCategory: ImageSizeCategories;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  originalImage?: string;
}
