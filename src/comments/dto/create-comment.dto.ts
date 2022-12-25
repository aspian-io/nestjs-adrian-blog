import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";

export class CreateCommentDto {
  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsOptional()
  title?: string;

  @IsString( { message: CommonErrorsLocale.VALIDATOR_IS_STRING } )
  @IsNotEmpty( { message: CommonErrorsLocale.VALIDATOR_IS_NOT_EMPTY } )
  content: string;

  @IsUUID( 'all', { message: CommonErrorsLocale.VALIDATOR_IS_UUID } )
  @IsOptional()
  parentId?: string;

  @IsUUID( 'all', { message: CommonErrorsLocale.VALIDATOR_IS_UUID } )
  postId: string;
}
