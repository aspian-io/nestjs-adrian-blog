import { BaseEntity } from "src/common/entities/base.entity";
import { Post } from "src/posts/entities/post.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Comment extends BaseEntity {
  @Column()
  title: string;

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

  @Column()
  replyLevel: number;

  @Column()
  isReplyAllowed: boolean;

  @ManyToOne( () => Comment, ( comment ) => comment.replies )
  parent?: Comment;

  @OneToMany( () => Comment, ( reply ) => reply.parent )
  replies?: Comment[];

  @ManyToOne( () => Post )
  post: Post;
}
