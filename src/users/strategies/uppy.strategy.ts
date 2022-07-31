import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IJwtStrategyPayload, IJwtStrategyUser } from './types';
import { EnvEnum } from 'src/env.enum';

@Injectable()
export class UppyJwtStrategy extends PassportStrategy( Strategy, 'uppy' ) {
  constructor ( private readonly configService: ConfigService ) {
    super( {
      jwtFromRequest: ExtractJwt.fromHeader( 'uppy-auth-token' ),
      secretOrKey: configService.getOrThrow( EnvEnum.AUTH_ACCESS_TOKEN_SECRET )
    } );
  }

  validate ( payload: IJwtStrategyPayload ): IJwtStrategyUser {
    return { userId: payload.sub, username: payload.email, claims: payload.clms };
  }
}