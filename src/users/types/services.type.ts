import { User } from "../entities/user.entity";

export enum LoginMethods {
  EMAIL_ONLY = "email_only",
  MOBILE_ONLY = "mobile_only",
  MOBILE_EMAIL = "mobile_email"
}

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
