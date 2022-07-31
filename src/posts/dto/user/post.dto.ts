import { Expose, Transform, Type } from "class-transformer";
import { FileDto } from "src/files/dto/file.dto";
import { TaxonomyDto } from "src/taxonomies/dto/taxonomy.dto";
import { MinimalUserDto } from "src/users/dto";

export class PostDto {
  @Expose()
  title: string;

  @Expose()
  subtitle?: string;

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

  @Transform( ( { obj } ) => obj?.likesNum )
  @Expose()
  likes: number;

  @Transform( ( { obj } ) => obj?.bookmarksNum )
  @Expose()
  bookmarks: number;

  @Expose()
  @Type( () => MinimalUserDto )
  createdBy: MinimalUserDto;
}