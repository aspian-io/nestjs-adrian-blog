import { Transform } from "class-transformer";
import { IsOptional } from "class-validator";
import { QueryStringUtil } from "src/common/utils/query-string.utils";
import { PostStatusEnum, PostVisibilityEnum } from "../entities/post.entity";

type OrderType = 'ASC' | 'DESC';

export class PostsQueryListDto {
  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.title"?: string;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.subtitle"?: string;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.parentTitle"?: string;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.projectOwner"?: string;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.content"?: string;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.slug"?: string;

  @Transform( ( { value } ) => QueryStringUtil.trim( value ) )
  @IsOptional()
  "searchBy.category"?: string;

  @Transform( ( { value } ) => QueryStringUtil.trim( value ) )
  @IsOptional()
  "filterBy.tag"?: string;

  @Transform( ( { value } ) => QueryStringUtil.trim( value ) )
  @IsOptional()
  "filterBy.categorySlug"?: string;

  @Transform( ( { value } ) => QueryStringUtil.trim( value ) )
  @IsOptional()
  "filterBy.tagSlug"?: string;

  @Transform( ( { value } ) => QueryStringUtil.toNumber( value ) )
  @IsOptional()
  "filterBy.commentsNumGte"?: number;

  @Transform( ( { value } ) => QueryStringUtil.toNumber( value ) )
  @IsOptional()
  "filterBy.likesNumGte"?: number;

  @Transform( ( { value } ) => QueryStringUtil.toNumber( value ) )
  @IsOptional()
  "filterBy.bookmarksNumGte"?: number;

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

  @Transform( ( { value } ) => QueryStringUtil.extractValueBasedOn( value, Object.values( PostStatusEnum ) ) )
  @IsOptional()
  "filterBy.visibility"?: PostVisibilityEnum;

  @Transform( ( { value } ) => QueryStringUtil.extractValuesListBasedOn( value, Object.values( PostStatusEnum ) ) )
  @IsOptional()
  "filterBy.status"?: PostStatusEnum[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedDateRange( value ) )
  @IsOptional()
  "filterBy.scheduledToPublish"?: Date[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedDateRange( value ) )
  @IsOptional()
  "filterBy.scheduledToArchive"?: Date[];

  @Transform( ( { value } ) => QueryStringUtil.toBoolean( value ) )
  @IsOptional()
  "filterBy.commentAllowed"?: boolean;

  @Transform( ( { value } ) => QueryStringUtil.toBoolean( value ) )
  @IsOptional()
  "filterBy.isPinned"?: boolean;

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedStrings( value ) )
  @IsOptional()
  "filterBy.categoryTerms"?: string[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedStrings( value ) )
  @IsOptional()
  "filterBy.tagTerms"?: string[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedStrings( value ) )
  @IsOptional()
  "filterBy.filenames"?: string[];

  @Transform( ( { value } ) => QueryStringUtil.trim( value ) )
  @IsOptional()
  "filterBy.featuredImage"?: string;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.title"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.subtitle"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.viewCount"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.commentsNum"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.likesNum"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.bookmarksNum"?: OrderType;

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