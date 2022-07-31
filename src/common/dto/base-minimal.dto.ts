import { Expose } from "class-transformer";

export class BaseMinimalDto {
  @Expose()
  id: string;

  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;

  @Expose()
  ipAddress?: string;

  @Expose()
  userAgent?: string;

  @Expose()
  deletedAt?: Date;
}