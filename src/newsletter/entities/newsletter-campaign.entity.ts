import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { Post } from "src/posts/entities/post.entity";
import { Column, Entity, ManyToOne } from "typeorm";

export enum SendingTypeEnum {
  ONE_TIME = "ONE_TIME",
  INTERVAL = "INTERVAL"
}

export enum SendingIntervalEnum {
  DAILY = "DAILY",
  EVERY_OTHER_DAY = "EVERY_OTHER_DAY",
  WEEKLY = "WEEKLY",
  EVERY_OTHER_WEEK = "EVERY_OTHER_WEEK",
  MONTHLY = "MONTHLY"
}

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

  @Column( { default: 0 } )
  sendingFailedTrackingNum: number;

  @Column( { default: true } )
  sendToSubscribers: boolean;

  @Column( { default: false } )
  sendToUsers: boolean;
}
