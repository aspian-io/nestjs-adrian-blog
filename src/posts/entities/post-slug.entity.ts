import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { Post } from "./post.entity";

@Entity()
export class PostSlugsHistory extends BaseMinimalEntity {
  @Column()
  slug: string;

  @ManyToOne( () => Post, ( post ) => post.slugsHistory )
  post: Post;
}