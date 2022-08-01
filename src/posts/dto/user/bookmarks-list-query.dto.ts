import { Transform } from "class-transformer";
import { IsOptional } from "class-validator";
import { QueryStringUtil } from "src/common/utils/query-string.utils";
import { FindOperator } from "typeorm";

export class BookmarksListQueryDto {
  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.postTitle": FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.trim( value ) )
  @IsOptional()
  "filterBy.categorySlug"?: string;

  @Transform( ( { value } ) => QueryStringUtil.trim( value ) )
  @IsOptional()
  "filterBy.tagSlug"?: string;

  @Transform( ( { value } ) => QueryStringUtil.extractPage( value ) )
  @IsOptional()
  page?: number = 1;

  @Transform( ( { value } ) => QueryStringUtil.extractLimit( value ) )
  @IsOptional()
  limit?: number = 10;
}