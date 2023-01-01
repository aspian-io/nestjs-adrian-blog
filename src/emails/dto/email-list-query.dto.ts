import { Transform } from "class-transformer";
import { IsOptional } from "class-validator";
import { QueryStringUtil } from "src/common/utils/query-string.utils";
import { FindOperator } from "typeorm";

type OrderType = 'ASC' | 'DESC';

export class EmailListQueryDto {
  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.from"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.to"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.subject"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.createdAt"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractPage( value ) )
  @IsOptional()
  page?: number = 1;

  @Transform( ( { value } ) => QueryStringUtil.extractLimit( value ) )
  @IsOptional()
  limit?: number = 10;
}