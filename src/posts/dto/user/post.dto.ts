import { Expose, Transform, Type } from "class-transformer";
import { FileDto } from "src/files/dto/file.dto";
import { PostTypeEnum } from "src/posts/entities/post.entity";
import { TaxonomyDto } from "src/taxonomies/dto/taxonomy.dto";
import { MinimalUserDto } from "src/users/dto";

export class PostDto {
  @Expose()
  id: string;

  @Expose()
  type: PostTypeEnum;

  @Expose()
  title: string;

  @Expose()
  subtitle?: string;

  @Expose()
  excerpt?: string;

  @Expose()
  content?: string;

  @Expose()
  slug: string;

  @Expose()
  @Type( () => FileDto )
  featuredImage?: FileDto;

  @Expose()
  commentAllowed?: Boolean;

  @Expose()
  viewCount?: number;

  @Expose()
  isPinned?: Boolean;

  @Expose()
  order?: number;

  @Expose()
  @Type( () => PostDto )
  ancestor: PostDto;

  @Expose()
  @Type( () => PostDto )
  child: PostDto;

  @Expose()
  @Type( () => PostDto )
  parent: PostDto;

  @Expose()
  @Type( () => TaxonomyDto )
  taxonomies: TaxonomyDto[];

  @Expose()
  @Type( () => FileDto )
  attachments: FileDto[];

  @Expose()
  commentsNum: number;

  @Expose()
  likes: string[];

  @Expose()
  likesNum: number;

  @Expose()
  bookmarks: string[];

  @Expose()
  bookmarksNum: number;

  @Expose()
  @Type( () => MinimalUserDto )
  createdBy: MinimalUserDto;

  @Expose()
  @Type( () => MinimalUserDto )
  projectOwner?: MinimalUserDto;

  @Expose()
  @Type( () => Date )
  createdAt: Date;

  @Expose()
  @Type( () => Date )
  updatedAt: Date;
}