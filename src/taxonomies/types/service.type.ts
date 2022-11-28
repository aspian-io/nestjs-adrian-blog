import { Taxonomy } from "../entities/taxonomy.entity";

// Find by slug return type
export interface ITaxonomyReturnFindBySlug {
  taxonomy: Taxonomy;
  redirect?: {
    status: number;
  };
}

export enum TaxonomyErrorsEnum {
  DUPLICATE_TAXONOMY = 'Duplicate Taxonomy',
  DUPLICATE_SLUG = 'Duplicate Slug',
}

export enum TaxonomyErrorsInternalCodeEnum {
  DUPLICATE_TAXONOMY = 4001,
  DUPLICATE_SLUG = 4002,
}