import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IJwtStrategyPayload, IJwtStrategyUser } from './types';
import { EnvEnum } from 'src/env.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy( Strategy, 'jwt' ) {
  constructor ( private readonly configService: ConfigService ) {
    super( {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow( EnvEnum.AUTH_ACCESS_TOKEN_SECRET )
    } );
  }

  validate ( payload: IJwtStrategyPayload ): IJwtStrategyUser {
    return { userId: payload.sub, username: payload.email, claims: payload.clms };
  }
}