import { Expose } from "class-transformer";
import { AvatarSourceEnum, GenderEnum } from "../entities/user.entity";

export class LoginRegisterDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;

  @Expose()
  avatarSource: AvatarSourceEnum;

  @Expose()
  avatar?: string;
}