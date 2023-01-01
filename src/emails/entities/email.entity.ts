import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { Column, Entity } from "typeorm";

export enum EmailPriorityEnum {
  HIGH = "high",
  LOW = "low",
  NORMAL = "normal"
}

@Entity()
export class Email extends BaseMinimalEntity {
  @Column()
  from: string;

  @Column()
  to: string;

  @Column()
  subject: string;

  @Column( { nullable: true } )
  cc?: string;

  @Column( { nullable: true } )
  bcc?: string;

  @Column( { nullable: true } )
  replyTo?: string;

  @Column()
  priority: EmailPriorityEnum;

  @Column()
  html: string;

  @Column()
  templateDesign: string;
}
