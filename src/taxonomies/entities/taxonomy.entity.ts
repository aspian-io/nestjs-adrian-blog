import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { File } from "src/files/entities/file.entity";
import { Column, Entity, Index, ManyToOne, OneToMany } from "typeorm";
import { TaxonomySlugsHistory } from "./taxonomy-slug.entity";

export enum TaxonomyTypeEnum {
  MENU = "MENU",
  MENU_ITEM = "MENU_ITEM",
  CATEGORY = "CATEGORY",
  TAG = "TAG"
}

@Entity()
export class Taxonomy extends BaseMinimalEntity {
  @Column( { enum: TaxonomyTypeEnum } )
  type: TaxonomyTypeEnum;

  @Column( { default: '/' } )
  href: string;

  @Column( { default: 0 } )
  order?: number;

  @ManyToOne( () => Taxonomy )
  parent?: Taxonomy;

  @Column( { nullable: true } )
  description?: string;

  @Column()
  term: string;

  @Column()
  @Index( 'taxonomy-slug-idx' )
  slug: string;

  @ManyToOne( () => File )
  featuredImage?: File;

  @OneToMany( () => TaxonomySlugsHistory, ( slug ) => slug.taxonomy, { cascade: true } )
  slugsHistory: TaxonomySlugsHistory[];
}
