import { User } from "src/users/entities/user.entity";
import { ManyToOne } from "typeorm";
import { BaseMinimalEntity } from "./base-minimal.entity";

export abstract class BaseEntity extends BaseMinimalEntity {
  @ManyToOne( () => User )
  createdBy: User;

  @ManyToOne( () => User )
  updatedBy?: User;
}