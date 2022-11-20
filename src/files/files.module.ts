import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { ConfigService } from '@nestjs/config';
import * as companion from '@uppy/companion';
import * as math from 'mathjs';
import { AuthGuard } from '@nestjs/passport';
import { UppyAuthMiddleware } from './middlewares/uppy-auth.middleware';
import { BullModule } from '@nestjs/bull';
import { FileQueues } from './queues/queues.enum';
import { ImageResizerJobConsumer } from './queues/consumers/image-resizer.consumer';
import { EnvEnum } from 'src/env.enum';

@Module( {
  imports: [
    TypeOrmModule.forFeature( [ File ] ),
    BullModule.registerQueue( {
      name: FileQueues.IMAGE_RESIZER,
    } )
  ],
  controllers: [ FilesController ],
  providers: [
    FilesService,
    { provide: 'UppyJwtGuard', useClass: AuthGuard( 'uppy' ) },
    UppyAuthMiddleware,
    ImageResizerJobConsumer
  ],
  exports: [ TypeOrmModule ]
} )
export class FilesModule implements NestModule {
  constructor (
    private readonly fileService: FilesService,
    private readonly configService: ConfigService
  ) { }

  configure ( consumer: MiddlewareConsumer ) {
    const { app: companionApp } = companion.app( this.fileService.getS3ConfigParams(
      math.evaluate( this.configService.getOrThrow( EnvEnum.S3_UPLOAD_LINK_EXPIRATION_IN_SECONDS ) )
    ) );

    consumer
      .apply(
        this.configService.getOrThrow( EnvEnum.NODE_ENV ) === "production" ? UppyAuthMiddleware : null,
        companionApp
      ).forRoutes( this.configService.getOrThrow( EnvEnum.UPLOAD_ROUTE ) );
  }
}
