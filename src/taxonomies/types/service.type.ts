import { Taxonomy } from "../entities/taxonomy.entity";

// Find by slug return type
export interface ITaxonomyReturnFindBySlug {
  taxonomy: Taxonomy;
  redirect?: {
    status: number;
  };
}