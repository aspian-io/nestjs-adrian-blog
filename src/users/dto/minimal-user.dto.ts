import { Expose } from "class-transformer";
import { GenderEnum } from "src/users/entities/user.entity";

export class MinimalUserDto {
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
}