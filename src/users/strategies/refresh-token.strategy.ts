import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Tokens } from '../types/services.type';
import { IRefreshTokenStrategyPayload, IRtStrategyUser } from './types';
import { EnvEnum } from 'src/env.enum';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy( Strategy, 'jwt-refresh' ) {
  constructor ( private readonly configService: ConfigService ) {
    super( {
      jwtFromRequest: ExtractJwt.fromExtractors( [ ( req: Request ) => { return req.cookies[ Tokens.REFRESH_TOKEN ]; } ] ),
      secretOrKey: configService.getOrThrow( EnvEnum.AUTH_REFRESH_TOKEN_SECRET ),
      passReqToCallback: true
    } );
  }

  validate ( req: Request, payload: IRefreshTokenStrategyPayload ): IRtStrategyUser {
    const refreshToken: string = req.cookies[ Tokens.REFRESH_TOKEN ];
    return {
      userId: payload.sub,
      username: payload.email,
      refreshToken
    };
  }
}