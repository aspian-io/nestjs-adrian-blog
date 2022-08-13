import { Global, Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module( {
  imports: [ HttpModule ],
  controllers: [ SmsController ],
  providers: [ SmsService ],
  exports: [SmsService]
} )
export class SmsModule { }
