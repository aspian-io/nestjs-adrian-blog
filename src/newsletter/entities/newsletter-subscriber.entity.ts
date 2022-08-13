import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { AfterLoad, Column, Entity } from "typeorm";

@Entity()
export class NewsletterSubscriber extends BaseMinimalEntity {
  @Column()
  name: string;

  @Column( { unique: true } )
  email: string;

  @Column( { default: false } )
  approved: boolean;

  @Column()
  token: number;

  @Column()
  tokenExpiresAt: Date;

  isTokenExpired: boolean;

  @AfterLoad()
  private getIsExpired () {
    this.isTokenExpired = this.tokenExpiresAt.getTime() < Date.now();
  }
}