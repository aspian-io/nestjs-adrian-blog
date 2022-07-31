import { IsIn, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CommonErrorsLocale } from 'src/i18n/locale-keys/common/errors.locale';
import { FilePolicyEnum, FileSectionEnum } from '../entities/file.entity';

export class UpdateFileDto {
  @IsIn( Object.values( FilePolicyEnum ) )
  @IsOptional()
  policy: FilePolicyEnum;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  filename: string;

  @IsIn( Object.values( FileSectionEnum ), { message: i18nValidationMessage( CommonErrorsLocale.VALIDATOR_IS_IN ) } )
  @IsOptional()
  section: FileSectionEnum;
}
