import { Expose, Type } from "class-transformer";
import { PostDto } from "src/posts/dto/user/post.dto";
import { GenderEnum } from "../entities/user.entity";

export class UserDto {
  @Expose()
  accessToken: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  bio: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  birthDate: Date;

  @Expose()
  gender: GenderEnum;

  @Expose()
  country: string;

  @Expose()
  state: string;

  @Expose()
  city: string;

  @Expose()
  address: string;

  @Expose()
  phone: string;

  @Expose()
  mobilePhone: string;

  @Expose()
  postalCode: string;

  @Expose()
  @Type(() => PostDto)
  bookmarks: PostDto[]

  @Expose()
  bookmarksNum: number;
}