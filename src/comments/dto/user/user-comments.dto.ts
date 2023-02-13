import { Expose, Transform, Type } from "class-transformer";
import { PostDto } from "src/posts/dto/user/post.dto";
import { AvatarSourceEnum } from "src/users/entities/user.entity";

export class UserCommentsDto {
  @Expose()
  id: string;

  @Expose()
  @Transform( ( { obj } ) => obj.createdBy.firstName )
  firstName: string;

  @Expose()
  @Transform( ( { obj } ) => obj.createdBy.lastName )
  lastName: string;

  @Expose()
  @Transform( ( { obj } ) => obj.createdBy?.avatar )
  avatar?: string;

  @Expose()
  @Transform( ( { obj } ) => obj.createdBy.avatarSource )
  avatarSource: AvatarSourceEnum;

  @Expose()
  @Transform( ( { obj } ) => obj.createdBy.role )
  role?: string;

  @Expose()
  title: string;

  @Expose()
  content: string;

  @Expose()
  likes: number;

  @Expose()
  likesNum: number;

  @Expose()
  dislikes: number;

  @Expose()
  dislikesNum: number;

  @Expose()
  replyLevel: number;

  @Expose()
  isReplyAllowed: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  post: PostDto;

  @Expose()
  ancestor?: string;

  @Expose()
  parent?: string;

  @Expose()
  ancestorChildrenNum: number;
}