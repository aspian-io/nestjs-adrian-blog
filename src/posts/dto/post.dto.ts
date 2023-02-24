import { Expose, Type } from "class-transformer";
import { FileDto } from "src/files/dto/file.dto";
import { File } from "src/files/entities/file.entity";
import { TaxonomyDto } from "src/taxonomies/dto/taxonomy.dto";
import { Taxonomy } from "src/taxonomies/entities/taxonomy.entity";
import { UserDto } from "src/users/dto";
import { User } from "src/users/entities/user.entity";
import { PostSlugsHistory } from "../entities/post-slug.entity";
import { PostStatusEnum, PostTypeEnum, PostVisibilityEnum, WidgetTypeEnum } from "../entities/post.entity";

export class AdminPostDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  subtitle: string | null;

  @Expose()
  excerpt: string | null;

  @Expose()
  content: string | null;

  @Expose()
  templateDesign: string | null;

  @Expose()
  slug: string;

  @Expose()
  @Type( () => FileDto )
  featuredImage?: FileDto;

  @Expose()
  visibility: PostVisibilityEnum;

  @Expose()
  status: PostStatusEnum;

  @Expose()
  scheduledToPublish: Date | null;

  @Expose()
  scheduledToArchive: Date | null;

  @Expose()
  commentAllowed?: Boolean;

  @Expose()
  viewCount?: number;

  @Expose()
  type: PostTypeEnum | WidgetTypeEnum;

  @Expose()
  isPinned?: Boolean;

  @Expose()
  order?: number;

  @Expose()
  @Type( () => AdminPostDto )
  ancestor: AdminPostDto;

  @Expose()
  @Type( () => AdminPostDto )
  child: AdminPostDto;

  @Expose()
  @Type( () => AdminPostDto )
  parent: AdminPostDto;

  @Expose()
  @Type( () => TaxonomyDto )
  taxonomies: TaxonomyDto[];

  @Expose()
  @Type( () => FileDto )
  attachments: FileDto[];

  @Expose()
  commentsNum: number;

  @Expose()
  @Type( () => UserDto )
  likes: UserDto[];

  @Expose()
  likesNum: number;

  @Expose()
  @Type( () => UserDto )
  bookmarks: UserDto[];

  @Expose()
  bookmarksNum: number;

  @Expose()
  @Type( () => PostSlugsHistory )
  slugsHistory: PostSlugsHistory[];

  @Expose()
  @Type( () => UserDto )
  projectOwner?: UserDto;

  @Expose()
  createdBy: UserDto;

  @Expose()
  @Type( () => UserDto )
  updatedBy?: UserDto;

  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;

  @Expose()
  ipAddress?: string;

  @Expose()
  userAgent?: string;

  @Expose()
  deletedAt?: Date;
}
