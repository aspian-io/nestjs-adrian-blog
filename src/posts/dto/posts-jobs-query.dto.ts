import { Transform } from "class-transformer";
import { IsOptional } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { QueryStringUtil } from "src/common/utils/query-string.utils";
import { PostTypeEnum } from "../entities/post.entity";

export class PostsJobsQueryDto extends PaginationDto {
  @Transform( ( { value } ) => QueryStringUtil.trim( value ) )
  @IsOptional()
  type?: PostTypeEnum;
}