import { Expose } from "class-transformer";
import { GenderEnum } from "../entities/user.entity";

export class LoginRegisterDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  gender: GenderEnum;

  @Expose()
  country?: string;

  @Expose()
  state?: string;

  @Expose()
  city?: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  accessToken: string;
}