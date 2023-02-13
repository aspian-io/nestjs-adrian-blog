import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { Post } from "src/posts/entities/post.entity";
import { User } from "src/users/entities/user.entity";
import { AfterLoad, Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Comment extends BaseMinimalEntity {
  @Column( { nullable: true } )
  title?: string;

  @Column()
  content: string;

  @ManyToMany( () => User )
  @JoinTable( { name: 'comments_likes' } )
  likes: User[];

  @Column( { default: 0 } )
  likesNum: number;

  @ManyToMany( () => User )
  @JoinTable( { name: 'comments_dislikes' } )
  dislikes: User[];

  @Column( { default: 0 } )
  dislikesNum: number;

  @Column()
  isApproved: boolean;

  @Column( { default: false } )
  seen?: boolean;

  @Column( { default: false } )
  isSpecial?: boolean;

  @ManyToOne( () => Comment, ( comment ) => comment.ancestorChildren, { onDelete: 'CASCADE' } )
  ancestor?: Comment;

  @OneToMany( () => Comment, ( comment ) => comment.ancestor )
  ancestorChildren?: Comment[];

  ancestorChildrenNum: number;

  @AfterLoad()
  private getAncestorChildrenNum () {
    this.ancestorChildrenNum = this.ancestorChildren?.length;
  }

  @ManyToOne( () => Comment )
  parent?: Comment;

  @ManyToOne( () => Post, { onDelete: 'CASCADE' } )
  post: Post;

  @ManyToOne( () => User )
  createdBy: User;

  @ManyToOne( () => User )
  updatedBy?: User;
}
