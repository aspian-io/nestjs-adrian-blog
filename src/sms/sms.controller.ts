import { IFarazSendSMSResult } from '@aspianet/faraz-sms';
import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { RequirePermission } from 'src/users/decorators/require-permission.decorator';
import { JwtAuthGuard } from 'src/users/guards/jwt.guard';
import { PermissionsGuard } from 'src/users/guards/require-permissions.guard';
import { SendSMSDto } from './dto/send-sms.dto';
import { SMSAddContactDto } from './dto/sms-add-contact.dto';
import { IFarazSMSAddNumberResult, IFarazSMSCredit, IPhoneBook } from './helpers/faraz-sms.helper';
import { SmsService } from './sms.service';

@Controller()
export class SmsController {
  constructor ( private readonly smsService: SmsService ) { }

  @Get( 'sms/is-sms-equipped' )
  isSMSEquipped (): boolean {
    return this.smsService.isSMSEquipped();
  }

  @Get( 'admin/sms/get-originators' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.SMS_READ )
  getOriginators (): string[] {
    return this.smsService.getOriginators();
  }

  @Get( 'admin/sms/get-credit' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.SMS_READ )
  getCredit ( @I18n() i18n: I18nContext ): Promise<IFarazSMSCredit> {
    return this.smsService.getCredit( i18n );
  }

  @Get( 'admin/sms/phone-books' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.SMS_READ )
  getPhoneBooks ( @I18n() i18n: I18nContext ): Promise<IPhoneBook[]> {
    return this.smsService.getPhoneBooks( i18n );
  }

  @Post( 'admin/sms/add-contact' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.SMS_CREATE )
  addContact ( @Body() smsAddContactDto: SMSAddContactDto, @I18n() i18n: I18nContext ): Promise<IFarazSMSAddNumberResult> {
    return this.smsService.addContact( smsAddContactDto, i18n );
  }

  @Post( 'admin/sms/send' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.SMS_CREATE )
  sendSMS ( @Body() sendSMSDto: SendSMSDto, @I18n() i18n: I18nContext ): Promise<void> {
    return this.smsService.sendSMS( sendSMSDto, i18n );
  }
}
