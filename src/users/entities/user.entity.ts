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
  email: string | null;

  @Column( { default: false } )
  emailVerified: boolean;

  @Column( { default: false } )
  organizationMember: boolean;

  @Column( { nullable: true } )
  emailVerificationToken: number | null;

  @Column( { default: () => 'CURRENT_TIMESTAMP(6)' } )
  emailVerificationTokenExpiresAt?: Date;

  isEmailVerificationTokenExpired: boolean;

  @AfterLoad()
  private getEmailVerificationTokenExpired () {
    this.isEmailVerificationTokenExpired = this.emailVerificationTokenExpiresAt?.getTime() < Date.now();
  }

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column( { nullable: true } )
  bio: string | null;

  @Column( { nullable: true } )
  role: string | null;

  @Column( { nullable: true } )
  birthDate: Date | null;

  @Column( { nullable: true } )
  gender: GenderEnum | null;

  @Column( { nullable: true } )
  country: string | null;

  @Column( { nullable: true } )
  state: string | null;

  @Column( { nullable: true } )
  city: string | null;

  @Column( { nullable: true } )
  address: string | null;

  @Column( { nullable: true } )
  phone: string | null;

  @Column( { nullable: true } )
  @Index( 'user-mobile-idx', { unique: true } )
  mobilePhone: string | null;

  @Column( { nullable: true } )
  mobilePhoneTemp: string | null;

  @Column( { nullable: true } )
  mobilePhoneVerificationToken: number | null;

  @Column( { default: () => 'CURRENT_TIMESTAMP(6)' } )
  mobilePhoneVerificationTokenExpiresAt: Date;

  isMobilePhoneVerificationTokenExpired: boolean;

  @AfterLoad()
  private getMobilePhoneVerificationTokenExpired () {
    this.isMobilePhoneVerificationTokenExpired = this.mobilePhoneVerificationTokenExpiresAt?.getTime() < Date.now();
  }

  @Column( { default: false } )
  mobilePhoneVerified: boolean;

  @Column( { nullable: true } )
  postalCode: string | null;

  @Column( { nullable: true } )
  website: string | null;

  @Column( { nullable: true } )
  facebook: string | null;

  @Column( { nullable: true } )
  twitter: string | null;

  @Column( { nullable: true } )
  instagram: string | null;

  @Column( { nullable: true } )
  linkedIn: string | null;

  @Column( { nullable: true } )
  pinterest: string | null;

  @Column( { nullable: true } )
  github: string | null;

  @Column( { nullable: true } )
  stackoverflow: string | null;

  @Column( { nullable: true } )
  suspend: Date | null;

  @Column( { nullable: true } )
  avatar: string | null;

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

  @OneToMany( () => Post, ( post ) => post.projectOwner, { cascade: true } )
  projects: Post[];

  @RelationId( ( post: Post ) => post.bookmarks )
  bookmarkIds: string[];

  toJSON () {
    delete this.password;
    return this;
  }
}
