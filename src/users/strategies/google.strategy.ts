import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { config } from 'dotenv';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvEnum } from 'src/env.enum';

config();

@Injectable()
export class GoogleStrategy extends PassportStrategy( Strategy, 'google' ) {

  constructor ( private readonly configService: ConfigService ) {
    super( {
      clientID: configService.getOrThrow( EnvEnum.OAUTH_GOOGLE_CLIENT_ID ),
      clientSecret: configService.getOrThrow( EnvEnum.OAUTH_GOOGLE_SECRET ),
      callbackURL: configService.getOrThrow( EnvEnum.OAUTH_GOOGLE_CALLBACK_URL ),
      scope: [ 'email', 'profile' ]
    } );
  }

  // authorizationParams (): { [ key: string ]: string; } {
  //   return ( {
  //     access_type: 'offline',
  //     prompt: 'consent'
  //   } );
  // };

  async validate ( _accessToken: string, _refreshToken: string, profile: any ): Promise<any> {
    const { id, name, emails, photos } = profile;
    const user = {
      provider: 'google',
      providerId: id,
      email: emails[ 0 ].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[ 0 ].value,
    };
    return user
  }
}