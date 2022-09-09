import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { SendEmailDto } from './dto/send-email.dto';
import { JwtAuthGuard } from 'src/users/guards/jwt.guard';
import { RequirePermission } from 'src/users/decorators/require-permission.decorator';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { EmailContactUsDto } from './dto/contact-us.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { PermissionsGuard } from 'src/users/guards/require-permissions.guard';

@Controller()
export class EmailsController {
  constructor ( private readonly emailsService: EmailsService ) { }

  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.EMAIL_SEND )
  @Post( 'admin/emails/send' )
  @HttpCode( HttpStatus.OK )
  async sendMail ( @Body() sendEmailDto: SendEmailDto ) {
    return this.emailsService.sendMail( sendEmailDto );
  }

  @Post( 'contact-us' )
  @HttpCode( HttpStatus.OK )
  contactUs ( @Body() dto: EmailContactUsDto, @I18n() i18n: I18nContext ) {
    return this.emailsService.contactUs( dto, i18n );
  }
}
