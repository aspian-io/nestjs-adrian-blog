import { Transform } from "class-transformer";
import { IsOptional } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { QueryStringUtil } from "src/common/utils/query-string.utils";

export class SearchDto extends PaginationDto { 
  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  keyword?: string;
}