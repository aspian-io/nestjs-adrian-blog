import { Global, Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';

@Global()
@Module( {
  imports: [
    TypeOrmModule.forFeature( [ Setting ] ),
  ],
  controllers: [ SettingsController ],
  providers: [ SettingsService ],
  exports: [ TypeOrmModule, SettingsService ]
} )
export class SettingsModule { }
