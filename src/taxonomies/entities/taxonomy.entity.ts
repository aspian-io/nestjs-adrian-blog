import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { File } from "src/files/entities/file.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

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

  @ManyToOne( () => Taxonomy, ( taxonomy ) => taxonomy.children )
  parent?: Taxonomy;

  @OneToMany( () => Taxonomy, ( taxonomy ) => taxonomy.parent )
  children?: Taxonomy[];

  @Column( { nullable: true } )
  description?: string;

  @Column()
  term: string;

  @Column()
  slug: string;

  @ManyToOne( () => File )
  featuredImage?: File;
}
