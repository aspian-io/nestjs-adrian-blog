import { Expose } from "class-transformer";
import { AvatarSourceEnum, GenderEnum } from "src/users/entities/user.entity";

export class MinimalUserDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  gender?: GenderEnum;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  bio?: string;

  @Expose()
  role?: string;

  @Expose()
  avatarSource: AvatarSourceEnum;

  @Expose()
  avatar?: string;

  @Expose()
  website?: string;

  @Expose()
  facebook?: string;

  @Expose()
  twitter?: string;

  @Expose()
  instagram?: string;

  @Expose()
  linkedIn?: string;

  @Expose()
  pinterest?: string;

  @Expose()
  github?: string;

  @Expose()
  stackoverflow?: string;
}