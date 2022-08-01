import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { Taxonomy } from "./taxonomy.entity";

@Entity()
export class TaxonomySlugsHistory extends BaseMinimalEntity {
  @Column()
  slug: string;

  @ManyToOne( () => Taxonomy, ( taxonomy ) => taxonomy.slugsHistory )
  taxonomy: Taxonomy;
}