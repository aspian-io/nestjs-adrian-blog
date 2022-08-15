import { Expose } from "class-transformer";

export class LoginMethodsDto {
  @Expose()
  emailLogin: boolean;

  @Expose()
  mobileLogin: boolean;
}