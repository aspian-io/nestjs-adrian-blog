import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { EnvEnum } from 'src/env.enum';
import { SendSMSDto } from './dto/send-sms.dto';
import { SMSAddContactDto } from './dto/sms-add-contact.dto';
import { FarazSMSHelper, IFarazSMSAddNumberResult, IFarazSMSCredit, IPhoneBook } from './helpers/faraz-sms.helper';

@Injectable()
export class SmsService {
  private readonly smsOriginators: string[];

  constructor (
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.smsOriginators = configService.getOrThrow( EnvEnum.SMS_ORIGINATORS )
      .split( ',' ).map( o => o.trim() );
    FarazSMSHelper.init(
      configService.getOrThrow( EnvEnum.SMS_USERNAME ),
      configService.getOrThrow( EnvEnum.SMS_PASSWORD ),
      httpService
    );
  }

  // Get originators
  getOriginators (): string[] {
    return this.smsOriginators;
  }

  // Get SMS provider remaining credit
  getCredit ( i18n: I18nContext ): Promise<IFarazSMSCredit> {
    return FarazSMSHelper.getCredit( i18n );
  }

  // Get phone books list
  getPhoneBooks ( i18n: I18nContext ): Promise<IPhoneBook[]> {
    return FarazSMSHelper.getPhoneBooksList( i18n );
  }

  // Add contact info
  addContact ( smsAddContactDto: SMSAddContactDto, i18n: I18nContext ): Promise<IFarazSMSAddNumberResult> {
    return FarazSMSHelper.addLineNumberToPhoneBook(
      i18n,
      smsAddContactDto.phoneBookId,
      smsAddContactDto.name,
      smsAddContactDto.lineNumber
    );
  }

  // Send a normal SMS
  sendSMS ( sendSMSDto: SendSMSDto, i18n: I18nContext ): Promise<void> {
    return FarazSMSHelper.send( i18n, sendSMSDto.originator, sendSMSDto.recipients, sendSMSDto.message );
  }

  // Send SMS by using Pattern Code
  sendByPattern ( i18n: I18nContext, pattern_code: string, originator: string, recipient: string, values: unknown )
    : Promise<void> {
    return FarazSMSHelper.sendByPatternCode( i18n, pattern_code, originator, recipient, values );
  }
}
