import { Transform } from "class-transformer";
import { IsOptional } from "class-validator";
import { QueryStringUtil } from "../utils/query-string.utils";

export class PaginationDto {
  @Transform( ( { value } ) => QueryStringUtil.extractPage( value ) )
  @IsOptional()
  page?: number = 1;

  @Transform( ( { value } ) => QueryStringUtil.extractLimit( value ) )
  @IsOptional()
  limit?: number = 10;
}