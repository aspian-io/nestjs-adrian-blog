import { BaseMinimalEntity } from "src/common/entities/base-minimal.entity";
import { Post } from "src/posts/entities/post.entity";
import { AfterLoad, Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { Claim } from "./claim.entity";

export enum GenderEnum {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other"
}

export enum AvatarSourceEnum {
  STORAGE = "STORAGE",
  OAUTH2 = "OAUTH2"
}

@Entity()
export class User extends BaseMinimalEntity {
  @Column( { default: false } )
  isActivated: boolean;

  @Column( { nullable: true } )
  @Index( 'user-email-idx', { unique: true } )
  email: string;

  @Column( { default: false } )
  emailVerified: boolean;

  @Column( { nullable: true } )
  emailVerificationToken?: number;

  @Column( { default: () => 'CURRENT_TIMESTAMP(6)' } )
  emailVerificationTokenExpiresAt?: Date;

  isEmailVerificationTokenExpired: boolean;

  @AfterLoad()
  private getEmailVerificationTokenExpired () {
    this.isEmailVerificationTokenExpired = this.emailVerificationTokenExpiresAt.getTime() < Date.now();
  }

  @Column( { nullable: true } )
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column( { nullable: true } )
  bio?: string;

  @Column( { nullable: true } )
  birthDate: Date;

  @Column( { nullable: true } )
  gender: GenderEnum;

  @Column( { nullable: true } )
  country: string;

  @Column( { nullable: true } )
  state: string;

  @Column( { nullable: true } )
  city: string;

  @Column( { nullable: true } )
  address: string;

  @Column( { nullable: true } )
  phone: string;

  @Column( { nullable: true } )
  @Index( 'user-mobile-idx', { unique: true } )
  mobilePhone: string;

  @Column( { nullable: true } )
  mobilePhoneTemp: string;

  @Column( { nullable: true } )
  mobilePhoneVerificationToken?: number;

  @Column( { default: () => 'CURRENT_TIMESTAMP(6)' } )
  mobilePhoneVerificationTokenExpiresAt?: Date;

  isMobilePhoneVerificationTokenExpired: boolean;

  @AfterLoad()
  private getMobilePhoneVerificationTokenExpired () {
    this.isMobilePhoneVerificationTokenExpired = this.mobilePhoneVerificationTokenExpiresAt.getTime() < Date.now();
  }

  @Column( { default: false } )
  mobilePhoneVerified: boolean;

  @Column( { nullable: true } )
  postalCode: string;

  @Column( { nullable: true } )
  website?: string;

  @Column( { nullable: true } )
  facebook?: string;

  @Column( { nullable: true } )
  twitter?: string;

  @Column( { nullable: true } )
  instagram?: string;

  @Column( { nullable: true } )
  linkedIn?: string;

  @Column( { nullable: true } )
  pinterest?: string;

  @Column( { nullable: true } )
  suspend: Date | null;

  @Column( { nullable: true } )
  avatar?: string;

  @Column( { enum: AvatarSourceEnum, default: AvatarSourceEnum.STORAGE } )
  avatarSource: AvatarSourceEnum;

  @ManyToMany( () => Claim, { cascade: true } )
  @JoinTable( { name: "users_claims" } )
  claims: Claim[];

  @ManyToMany( () => Post, ( post ) => post.bookmarks, { cascade: true } )
  @JoinTable( {
    name: 'users_posts_bookmarks',
  } )
  bookmarks: Post[];

  @RelationId( ( post: Post ) => post.bookmarks )
  bookmarkIds: string[];
}
