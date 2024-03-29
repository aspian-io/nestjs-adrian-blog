import { Transform } from "class-transformer";
import { IsOptional } from "class-validator";
import { QueryStringUtil } from "src/common/utils/query-string.utils";

type OrderType = 'ASC' | 'DESC';

export class UserBlogsListDto {
  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  search?: string;

  @Transform( ( { value } ) => QueryStringUtil.trim( value ) )
  @IsOptional()
  "filterBy.category"?: string;

  @Transform( ( { value } ) => QueryStringUtil.trim( value ) )
  @IsOptional()
  "filterBy.tag"?: string;

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedStrings( value ) )
  @IsOptional()
  "filterBy.tagTerms"?: string[];

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.viewCount"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.likesNum"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.bookmarksNum"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.createdAt"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractPage( value ) )
  @IsOptional()
  page?: number = 1;

  @Transform( ( { value } ) => QueryStringUtil.extractLimit( value, 10, 30 ) )
  @IsOptional()
  limit?: number = 10;
}