import { Expose } from "class-transformer";

export class LoginRegisterDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  gender: string;

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