import { Expose, Type } from "class-transformer";
import { UserCommentsDto } from "./user-comments.dto";

export class UserCommentsListDto {
  @Expose()
  meta: any;

  @Expose()
  @Type( () => UserCommentsDto )
  items: UserCommentsDto[];
}