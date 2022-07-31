import { PermissionsEnum } from "src/common/security/permissions.enum";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Claim {
  @PrimaryGeneratedColumn( 'uuid' )
  id: string;

  @Column( { unique: true } )
  name: PermissionsEnum;
}