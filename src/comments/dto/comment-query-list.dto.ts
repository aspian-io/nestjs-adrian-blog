import { Transform } from "class-transformer";
import { IsOptional } from "class-validator";
import { QueryStringUtil } from "src/common/utils/query-string.utils";
import { FindOperator } from "typeorm";

type OrderType = 'ASC' | 'DESC';

export class CommentQueryListDto {
  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.title"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.content"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "filterBy.postTitle"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.toNumber( value ) )
  @IsOptional()
  "filterBy.likesNumGte"?: number;

  @Transform( ( { value } ) => QueryStringUtil.toNumber( value ) )
  @IsOptional()
  "filterBy.dislikesNumGte"?: number;

  @Transform( ( { value } ) => QueryStringUtil.toBoolean( value ) )
  @IsOptional()
  "filterBy.isApproved"?: boolean;

  @Transform( ( { value } ) => QueryStringUtil.toBoolean( value ) )
  @IsOptional()
  "filterBy.seen"?: boolean;

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedDateRange( value ) )
  @IsOptional()
  "filterBy.createdAt"?: Date[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedDateRange( value ) )
  @IsOptional()
  "filterBy.updatedAt"?: Date[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedStrings( value ) )
  @IsOptional()
  "filterBy.createdBy"?: string[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedStrings( value ) )
  @IsOptional()
  "filterBy.updatedBy"?: string[];

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.title"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.content"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.isApproved"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.isSpecial"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.seen"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.likesNum"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.dislikesNum"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.isReplyAllowed"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.createdAt"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.updatedAt"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.ipAddress"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.userAgent"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractPage( value ) )
  @IsOptional()
  page?: number = 1;

  @Transform( ( { value } ) => QueryStringUtil.extractLimit( value ) )
  @IsOptional()
  limit?: number = 10;
}