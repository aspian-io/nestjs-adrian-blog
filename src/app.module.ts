import { CacheInterceptor, CacheModule, CacheModuleOptions, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './settings/settings.module';
import { FilesModule } from './files/files.module';
import { AppSeederService } from './app-seeder.service';
import { I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import * as redisStore from 'cache-manager-redis-store';
import type { ClientOpts } from 'redis';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { EnvEnum } from './env.enum';
import { EmailsModule } from './emails/emails.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { PostsModule } from './posts/posts.module';
import { TaxonomiesModule } from './taxonomies/taxonomies.module';
import { SmsModule } from './sms/sms.module';
import { CommentsModule } from './comments/comments.module';
import * as nodemailer from 'nodemailer';
import { RedisDbEnum } from './common/redis/redis-db.enum';

@Module( {
  imports: [
    ConfigModule.forRoot( {
      isGlobal: true,
      cache: true,
    } ),
    CacheModule.registerAsync( {
      imports: [ ConfigModule ],
      inject: [ ConfigService ],
      isGlobal: true,
      useFactory: ( configService: ConfigService ): CacheModuleOptions<ClientOpts> => ( {
        db: RedisDbEnum.CACHE,
        store: redisStore,
        host: configService.getOrThrow( EnvEnum.REDIS_HOST ),
        port: +configService.getOrThrow( EnvEnum.REDIS_PORT ),
        password: configService.getOrThrow( EnvEnum.REDIS_PASSWORD ),
        ttl: 1, // seconds
        max: 200, // maximum number of items in cache
      } ),
    } ),
    BullModule.forRootAsync( {
      imports: [ ConfigModule ],
      inject: [ ConfigService ],
      useFactory: ( configService: ConfigService ) => ( {
        redis: {
          db: RedisDbEnum.BULL_QUEUE,
          host: configService.getOrThrow( EnvEnum.REDIS_HOST ),
          port: +configService.getOrThrow( EnvEnum.REDIS_PORT ),
          password: configService.getOrThrow( EnvEnum.REDIS_PASSWORD ),
        }
      } ),
    } ),
    I18nModule.forRootAsync( {
      imports: [ ConfigModule ],
      inject: [ ConfigService ],
      useFactory: ( configService: ConfigService ) => ( {
        fallbackLanguage: configService.getOrThrow( EnvEnum.I18N_DEFAULT_LANG ),
        loaderOptions: {
          path: path.join( __dirname, '/i18n/' ),
          watch: true,
        },
      } )
    } ),
    TypeOrmModule.forRootAsync( {
      imports: [ ConfigModule ],
      inject: [ ConfigService ],
      useFactory: ( configService: ConfigService ) => ( {
        type: configService.getOrThrow<any>( EnvEnum.DB_TYPE ),
        host: configService.getOrThrow( EnvEnum.DB_HOST ),
        port: +configService.getOrThrow( EnvEnum.DB_PORT ),
        username: configService.getOrThrow( EnvEnum.DB_USERNAME ),
        password: configService.getOrThrow( EnvEnum.DB_PASSWORD ),
        database: configService.getOrThrow<string>( EnvEnum.DB_NAME ),
        autoLoadEntities: true,
        synchronize: configService.getOrThrow( EnvEnum.NODE_ENV ) === 'development',
        //logging: true
      } )
    } ),
    MailerModule.forRootAsync( {
      imports: [ ConfigModule ],
      inject: [ ConfigService ],
      useFactory: async ( configService: ConfigService ) => ( {
        transport: {
          host: configService.getOrThrow( EnvEnum.MAILER_HOST ),
          port: configService.getOrThrow( EnvEnum.MAILER_PORT ),
          // ignoreTLS: true,
          secure: false,
          auth: {
            user: ( await nodemailer.createTestAccount() ).user,
            pass: ( await nodemailer.createTestAccount() ).pass,
          },
        },
        defaults: {
          from: '"No Reply" <no-reply@localhost>',
        },
        preview: true,
        template: {
          dir: path.join( __dirname, './emails/templates/' ),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      } )
    } ),
    UsersModule,
    SettingsModule,
    FilesModule,
    EmailsModule,
    PostsModule,
    TaxonomiesModule,
    SmsModule,
    CommentsModule,
  ],
  controllers: [ AppController ],
  providers: [ AppService, AppSeederService, {
    provide: APP_INTERCEPTOR,
    useClass: CacheInterceptor,
  } ],
} )

export class AppModule { }
