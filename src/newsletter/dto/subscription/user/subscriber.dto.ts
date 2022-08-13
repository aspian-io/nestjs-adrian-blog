import { Expose } from "class-transformer";

export class SubscriberDto {
  @Expose()
  name: string;

  @Expose()
  email: string;
}