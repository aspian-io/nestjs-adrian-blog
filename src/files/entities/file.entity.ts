import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";

export enum FilePolicyEnum {
  PUBLIC_READ = "public-read",
  PRIVATE = "private"
}

export enum FileSectionEnum {
  GENERAL = "GENERAL",
  SITE_LOGO = "SITE_LOGO",
  MAIN_SLIDESHOW = "MAIN_SLIDESHOW",
  USER = "USER",
  BLOG = "BLOG",
  NEWS = "NEWS",
  BRAND_LOGO = "BRAND_LOGO",
  PRODUCT = "PRODUCT",
  COURSE = "COURSE"
}

export enum ImageSizeCategories {
  SIZE_75 = "SIZE_75",
  SIZE_160 = "SIZE_160",
  SIZE_320 = "SIZE_320",
  SIZE_480 = "SIZE_480",
  SIZE_640 = "SIZE_640",
  SIZE_800 = "SIZE_800",
  SIZE_1200 = "SIZE_1200",
  SIZE_1600 = "SIZE_1600",
  ORIGINAL = "ORIGINAL"
}

export enum FileStatus {
  READY = "READY",
  IN_PROGRESS = "IN_PROGRESS",
  FAILED = "FAILED"
}

@Entity()
export class File extends BaseMinimalEntity {
  @Column( { unique: true } )
  key: string;

  @Column( { enum: FilePolicyEnum } )
  policy: FilePolicyEnum;

  @Column()
  filename: string;

  @Column()
  type: string;

  @Column()
  size: number;

  @Column( { enum: FileStatus } )
  status: FileStatus;

  @Column( { enum: FileSectionEnum } )
  section: FileSectionEnum;

  @Column( { enum: ImageSizeCategories, nullable: true } )
  imageSizeCategory?: ImageSizeCategories;

  @ManyToOne( () => File, ( file ) => file.generatedImageChildren )
  originalImage: File;

  @OneToMany( () => File, ( file ) => file.originalImage )
  generatedImageChildren: File[];

  @Column( { nullable: true } )
  thumbnail?: string;

  @Column( { nullable: true } )
  imageAlt?: string;
}
