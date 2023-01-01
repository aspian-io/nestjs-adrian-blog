import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { Column, Entity } from "typeorm";

@Entity()
export class NewsletterCampaign extends BaseMinimalEntity {
  @Column( { unique: true } )
  name: string;

  @Column( { nullable: true } )
  description?: string;

  @Column( { default: () => 'CURRENT_TIMESTAMP(6)' } )
  sendingTime: Date;

  @Column()
  emailSubject: string;

  @Column()
  content: string;

  @Column()
  templateDesign: string;

  @Column( { default: 0 } )
  sendingFailedTrackingNum: number;

  @Column( { default: true } )
  sendToSubscribers: boolean;

  @Column( { default: false } )
  sendToUsers: boolean;

  @Column( { default: false } )
  beenSent: boolean;
}
