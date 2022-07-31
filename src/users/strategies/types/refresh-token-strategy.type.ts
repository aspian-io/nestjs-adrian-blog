export interface IRtStrategyUser {
  userId: string;
  username: string;
  refreshToken: string;
}

export interface IRefreshTokenStrategyPayload {
  sub: string;
  email: string;
  refreshToken: string;
}