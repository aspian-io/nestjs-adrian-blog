import { Transform } from "class-transformer";
import { IsOptional } from "class-validator";
import { QueryStringUtil } from "src/common/utils/query-string.utils";
import { FilePolicyEnum, FileSectionEnum, FileStatus, ImageSizeCategories } from "../entities/file.entity";

type OrderType = 'ASC' | 'DESC';

export class FilesListQueryDto {

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.filename"?: string;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.key"?: string;

  @Transform( ( { value } ) => QueryStringUtil.extractValuesListBasedOn( value, Object.values( FilePolicyEnum ) ) )
  @IsOptional()
  "filterBy.policy"?: FilePolicyEnum[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedStrings( value ) )
  @IsOptional()
  "filterBy.type"?: string[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedNumberRange( value ) )
  @IsOptional()
  "filterBy.size"?: number[];

  @Transform( ( { value } ) => QueryStringUtil.extractValuesListBasedOn( value, Object.values( FileStatus ) ) )
  @IsOptional()
  "filterBy.status"?: FileStatus[];

  @Transform( ( { value } ) => QueryStringUtil.extractValuesListBasedOn( value, Object.values( FileSectionEnum ) ) )
  @IsOptional()
  "filterBy.section"?: FileSectionEnum[];

  @Transform( ( { value } ) => QueryStringUtil.extractValuesListBasedOn( value, Object.values( ImageSizeCategories ) ) )
  @IsOptional()
  "filterBy.imageSizeCategory"?: ImageSizeCategories[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedDateRange( value ) )
  @IsOptional()
  "filterBy.createdAt"?: Date[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedDateRange( value ) )
  @IsOptional()
  "filterBy.updatedAt"?: Date[];

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.key"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.filename"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.policy"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.type"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.size"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.status"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.section"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.createdAt"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.updatedAt"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractPage( value ) )
  @IsOptional()
  page?: number = 1;

  @Transform( ( { value } ) => QueryStringUtil.extractLimit( value ) )
  @IsOptional()
  limit?: number = 10;
}