import { IsIn, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CommonErrorsLocale } from 'src/i18n/locale-keys/common/errors.locale';
import { FilePolicyEnum } from '../entities/file.entity';

export class UpdateFileDto {
  @IsIn( Object.values( FilePolicyEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN as any ) } )
  @IsOptional()
  policy: FilePolicyEnum;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  filename: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  thumbnail?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  imageAlt?: string;
}
