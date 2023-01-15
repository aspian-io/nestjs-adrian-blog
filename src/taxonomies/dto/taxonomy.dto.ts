import { Expose, Type } from "class-transformer";

export class TaxonomyDto {
  @Expose()
  href?: string;

  @Expose()
  order?: number;

  @Expose()
  @Type( () => TaxonomyDto )
  parent?: TaxonomyDto;

  @Expose()
  @Type( () => TaxonomyDto )
  children?: TaxonomyDto[];

  @Expose()
  childLevel?: number;

  @Expose()
  term: string;

  @Expose()
  description?: string;

  @Expose()
  slug: string;

  @Expose()
  featuredImage?: string;
}