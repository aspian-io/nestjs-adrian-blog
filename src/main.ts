import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { i18nValidationErrorFactory, I18nValidationExceptionFilter } from 'nestjs-i18n';
import * as companion from '@uppy/companion';
import { EnvEnum } from './env.enum';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap () {
  // Get Nest app
  const app = await NestFactory.create<NestExpressApplication>( AppModule );
  // Get config service
  const config = app.get( ConfigService );
  // In case of using reverse proxy
  if ( config.getOrThrow( EnvEnum.TRUST_PROXY_ENABLE ) === "true" ) {
    app.set( 'trust proxy', config.get( EnvEnum.TRUST_PROXY_IP ) );
  }
  // CORS Config
  app.enableCors( {
    origin: "http://localhost:3000",
    credentials: true,
    allowedHeaders: [
      'Authorization',
      "x-amz-date",
      "x-amz-content-sha256",
      'Origin',
      'Content-Type',
      'Accept',
      'uppy-auth-token'
    ],
    exposedHeaders: [ "ETag" ],
    methods: [ 'get', 'post', 'put', 'PATCH', 'OPTIONS', 'delete', 'DELETE' ],
    optionsSuccessStatus: 200,
  } );

  // Use global filters and config
  app.useGlobalFilters( new I18nValidationExceptionFilter() );
  // Use global pipes and config
  app.useGlobalPipes( new ValidationPipe( { exceptionFactory: i18nValidationErrorFactory, transform: true, whitelist: true } ) );
  // Use cookie parser
  app.use( cookieParser( config.get( EnvEnum.COOKIE_SECRET ) ) );

  // Run the server
  const server = await app.listen( 3001 );

  // Uppy companion socket
  companion.socket( server as any );
}
bootstrap();
