import { Expose, Type } from "class-transformer";
import { TaxonomyTypeEnum } from "../entities/taxonomy.entity";

export class TaxonomyDto {
  @Expose()
  id: string;

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
  type: TaxonomyTypeEnum;

  @Expose()
  featuredImage?: string;
}