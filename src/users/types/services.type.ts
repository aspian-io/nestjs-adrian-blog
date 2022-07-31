import { User } from "../entities/user.entity";

// Tokens Type
export enum Tokens {
  ACCESS_TOKEN = 'AT',
  REFRESH_TOKEN = 'RT'
};

// Login Return Type
export interface IServiceUserLoginResult extends User {
  accessToken: string;
  refreshToken: string;
}

// Register Return Type
export interface IServiceUserRegisterResult extends User {
  accessToken: string;
  refreshToken: string;
}

// Refresh Tokens Return Type
export interface IServiceUserRefreshTokensResult extends User {
  accessToken: string;
  refreshToken: string;
}
