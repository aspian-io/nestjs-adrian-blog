import { Expose, Type } from "class-transformer";
import { LogoFileDto } from "src/files/dto/logo-file.dto";
import { File } from "src/files/entities/file.entity";
import { PostDto } from "src/posts/dto/user/post.dto";
import { Post } from "src/posts/entities/post.entity";
import { SettingsKeyEnum } from "src/settings/types/settings-key.enum";
import { TaxonomyDto } from "src/taxonomies/dto/taxonomy.dto";
import { Taxonomy } from "src/taxonomies/entities/taxonomy.entity";

export interface ILayout {
  primaryMenuItems: Taxonomy[];
  secondaryMenuItems: Taxonomy[];
  siteName: string;
  siteDescription: string;
  siteURL: string;
  siteLogos: {
    type: SettingsKeyEnum;
    file: File;
  }[];
  heroSectionData: Post[];
  serviceSectionData: Post[];
  contactWidgetData: Post[];
  linksWidgetData: Post[];
  newsletterWidgetData: Post[];
}

export class LayoutDto {
  @Expose()
  @Type( () => TaxonomyDto )
  primaryMenuItems: TaxonomyDto[];

  @Expose()
  @Type( () => TaxonomyDto )
  secondaryMenuItems: TaxonomyDto[];

  @Expose()
  siteName: string;

  @Expose()
  siteDescription: string;

  @Expose()
  siteURL: string;

  @Expose()
  @Type( () => LogoFileDto )
  siteLogos: LogoFileDto[];

  @Expose()
  @Type( () => PostDto )
  heroSectionData: PostDto[];

  @Expose()
  @Type( () => PostDto )
  serviceSectionData: PostDto[];

  @Expose()
  @Type( () => PostDto )
  contactWidgetData: PostDto[];

  @Expose()
  @Type( () => PostDto )
  linksWidgetData: PostDto[];

  @Expose()
  @Type( () => PostDto )
  newsletterWidgetData: PostDto[];
}