import { Expose, Type } from "class-transformer";
import { FilePolicyEnum, ImageSizeCategories } from "../entities/file.entity";

export class FileDto {
  @Expose()
  key: string;

  @Expose()
  policy: FilePolicyEnum;

  @Expose()
  filename: string;

  @Expose()
  type: string;

  @Expose()
  size: number;

  @Expose()
  imageSizeCategory?: ImageSizeCategories;

  @Expose()
  @Type( () => FileDto )
  originalImage?: FileDto;

  @Expose()
  @Type( () => FileDto )
  videoThumbnail?: FileDto;
}