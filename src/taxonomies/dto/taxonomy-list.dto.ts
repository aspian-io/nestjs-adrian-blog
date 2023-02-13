import { Expose, Type } from "class-transformer";
import { TaxonomyDto } from "./taxonomy.dto";

export class TaxonomyListDto {
  @Expose()
  meta: any;

  @Expose()
  @Type( () => TaxonomyDto )
  items: TaxonomyDto[];
}