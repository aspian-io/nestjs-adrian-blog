import { User } from "../entities/user.entity";

// Tokens Type
export enum Tokens {
  ACCESS_TOKEN = 'AT',
  REFRESH_TOKEN = 'RT'
};

// Login Return Type
export interface IServiceUserLoginResult extends Partial<User> {
  accessToken: string;
  refreshToken: string;
}

// Register Return Type
export interface IServiceUserRegisterResult extends Partial<User> {
  accessToken: string;
  refreshToken: string;
}

// Refresh Tokens Return Type
export interface IServiceUserRefreshTokensResult extends Partial<User> {
  accessToken: string;
  refreshToken: string;
}

// Auth Errors
export enum UserErrorsEnum {
  INACTIVE_ACCOUNT = 'Inactive Account',
  SUSPENDED_ACCOUNT = 'Suspended Account',
  ALREADY_VERIFIED = 'Already Verified'
}

export enum UserErrorsInternalCodeEnum {
  INACTIVE_ACCOUNT = 4031,
  SUSPENDED_ACCOUNT = 4032,
  ALREADY_VERIFIED = 4033
}