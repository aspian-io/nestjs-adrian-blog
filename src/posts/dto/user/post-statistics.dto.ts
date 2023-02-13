import { Expose, Type } from "class-transformer";

export class PostStatisticsDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  slug: string;

  @Expose()
  viewCount?: number;

  @Expose()
  commentsNum: number;

  @Expose()
  likesNum: number;

  @Expose()
  bookmarksNum: number;

  @Expose()
  @Type( () => Date )
  createdAt: Date;

  @Expose()
  @Type( () => Date )
  updatedAt: Date;
}