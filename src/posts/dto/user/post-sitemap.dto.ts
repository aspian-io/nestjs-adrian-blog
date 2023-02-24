import { Expose, Type } from "class-transformer";
import { PostTypeEnum } from "src/posts/entities/post.entity";

export class PostSitemapDto {
  @Expose()
  type: PostTypeEnum;

  @Expose()
  slug: string;

  @Expose()
  @Type( () => Date )
  updatedAt: Date;
}