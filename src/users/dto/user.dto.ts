import { Expose } from "class-transformer";
import { AvatarSourceEnum, GenderEnum } from "../entities/user.entity";

export class UserDto {
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
  emailVerified: boolean;

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
  mobilePhoneVerified: boolean;

  @Expose()
  postalCode: string;

  @Expose()
  avatarSource: AvatarSourceEnum;

  @Expose()
  avatar?: string;

  @Expose()
  bookmarkIds: string[];

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
}