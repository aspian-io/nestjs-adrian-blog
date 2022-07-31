export interface IJwtStrategyUser {
  userId: string;
  username: string;
  claims: string[];
}

export interface IJwtStrategyPayload {
  sub: string;
  email: string;
  clms: string[];
}