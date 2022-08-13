import { User } from "../entities/user.entity";

// Login User Result
export interface IControllerUserLoginResult extends Partial<User> {
  accessToken: string;
}

// Register User Result
export interface IControllerUserRegisterResult extends IControllerUserLoginResult { }

// Refresh Tokens Result
export interface IControllerUserRefreshTokensResult extends IControllerUserLoginResult { }
