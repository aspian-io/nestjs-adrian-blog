import { OmitType } from "@nestjs/mapped-types";
import { Expose, Type } from "class-transformer";
import { AdminPostDto } from "./post.dto";

class AdminPostExceptContentDto extends OmitType( AdminPostDto, [ 'content' ] as const ) { }

export class AdminPostListDto {
  @Expose()
  meta: any;

  @Expose()
  @Type( () => AdminPostExceptContentDto )
  items: AdminPostExceptContentDto[];
}