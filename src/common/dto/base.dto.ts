import { BaseMinimalDto } from "./base-minimal.dto";

export class BaseDto<T> extends BaseMinimalDto {
  createdBy: T;
  updatedBy?: T;
}