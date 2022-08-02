import { Expose, Transform, Type } from "class-transformer";

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