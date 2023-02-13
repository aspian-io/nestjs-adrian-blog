import { Expose, Type } from "class-transformer";
import { MiniPostDto } from "./mini-post.dto";

export class PostListDto {
  @Expose()
  meta: any;

  @Expose()
  @Type( () => MiniPostDto )
  items: MiniPostDto[];
}