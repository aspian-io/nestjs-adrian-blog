import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { SettingsKeyEnum } from "../types/settings-key.enum";
import { SettingsServiceEnum } from "../types/settings-service.enum";

@Entity()
export class Setting extends BaseMinimalEntity {
  @Column()
  key: SettingsKeyEnum;

  @Column( { nullable: true } )
  value?: string;

  @Column()
  service: SettingsServiceEnum;

  @ManyToOne( () => User )
  createdBy?: User;

  @ManyToOne( () => User )
  updatedBy?: User;
}
