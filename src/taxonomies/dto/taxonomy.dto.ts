import { Expose, Type } from "class-transformer";
import { FileDto } from "src/files/dto/file.dto";

export class TaxonomyDto {
  @Expose()
  href: string;

  @Expose()
  order?: number;

  @Expose()
  @Type( () => TaxonomyDto )
  parent?: TaxonomyDto;

  @Expose()
  term: string;

  @Expose()
  description?: string;

  @Expose()
  slug: string;

  @Expose()
  @Type( () => FileDto )
  featuredImage?: FileDto;
}