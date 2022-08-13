import { Expose, Transform, Type } from "class-transformer";
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
  title: string;

  @Expose()
  content: string;

  @Expose()
  likesNum: number;

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
  @Transform( ( { obj } ) => obj.post )
  postId: string;

  @Expose()
  @Transform( ( { obj } ) => obj.parent )
  parentId: UserCommentsDto;
}