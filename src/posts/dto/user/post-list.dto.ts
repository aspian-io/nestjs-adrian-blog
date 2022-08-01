import { Expose, Type } from "class-transformer";
import { PostDto } from "./post.dto";

export class PostListDto {
  @Expose()
  meta: any;

  @Expose()
  @Type( () => PostDto )
  items: PostDto[];
}