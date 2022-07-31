import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "src/users/entities/user.entity";

export interface IMetadataDecorator {
  user?: Partial<User>;
  ipAddress: string;
  userAgent: string;
}

export const Metadata = createParamDecorator(
  ( data: unknown, ctx: ExecutionContext ) => {
    const request = ctx.switchToHttp().getRequest();
    const metadata: IMetadataDecorator = {
      user: {id: request.user?.userId, email: request.user?.username, claims: request.user?.claims},
      ipAddress: request.ip,
      userAgent: request.get( 'User-Agent' ) ?? 'unknown'
    };

    return metadata;
  }
);