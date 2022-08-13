import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { CommonErrorsLocale } from 'src/i18n/locale-keys/common/errors.locale';
import { SettingsService } from 'src/settings/settings.service';
import { SettingsKeyEnum } from 'src/settings/types/settings-key.enum';
import { EmailContactUsDto } from './dto/contact-us.dto';
import { SendEmailDto } from './dto/send-email.dto';
import * as path from 'path';
import { PostsService } from 'src/posts/posts.service';

@Injectable()
export class EmailsService {
  constructor (
    private readonly mailerService: MailerService,
    private readonly settingsService: SettingsService,
    private readonly postsService: PostsService
  ) { }
  // Send email
  sendMail ( sendEmailDto: SendEmailDto ) {
    return this.mailerService.sendMail( {
      from: sendEmailDto.from,
      to: sendEmailDto.to,
      subject: sendEmailDto.subject,
      cc: sendEmailDto.cc,
      bcc: sendEmailDto.bcc,
      replyTo: sendEmailDto.replyTo,
      priority: sendEmailDto.priority,
      html: sendEmailDto.html,
    } );
  }

  // Contact us
  async contactUs ( dto: EmailContactUsDto, i18n: I18nContext ) {
    let contactEmail = ( await this.settingsService.findOneOrNull( SettingsKeyEnum.SITE_CONTACT_EMAIL ) )?.value;
    if ( !contactEmail ) {
      contactEmail = ( await this.settingsService.findOneOrNull( SettingsKeyEnum.SITE_ADMIN_EMAIL ) )?.value;
      if ( !contactEmail ) {
        throw new BadRequestException( i18n.t( CommonErrorsLocale.Bad_Request ) );
      }
    }

    await this.mailerService.sendMail( {
      from: dto.from,
      to: contactEmail,
      subject: dto.subject,
      priority: dto.priority,
      html: dto.html
    } );

    const defaultTemplatePath = path.join( __dirname, './templates/contact-us.template.hbs' );
    const customTemplateId = ( await this.settingsService.findOneOrNull( SettingsKeyEnum.CONTACT_AUTO_RESPONSE_TEMPLATE_ID ) )?.value;
    const customTemplate = customTemplateId ? await this.postsService.findOne( customTemplateId ) : null;
    const websiteName = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_NAME ) ).value;
    const websiteUrl = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_URL ) ).value;
    const subject = ( await this.settingsService.findOne( SettingsKeyEnum.CONTACT_AUTO_RESPONSE_EMAIL_SUBJECT ) ).value;
    const siteSupportEmail = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_SUPPORT_EMAIL ) ).value;

    if ( customTemplate ) {
      const compiledTemplate = Handlebars.compile( customTemplate );
      const html = compiledTemplate( {
        websiteName,
        websiteUrl
      } );
      return this.mailerService.sendMail( {
        from: siteSupportEmail,
        to: dto.from,
        subject,
        html,
      } );
    }

    return this.mailerService.sendMail( {
      from: siteSupportEmail,
      to: dto.from,
      subject,
      template: defaultTemplatePath,
      context: { websiteName, websiteUrl }
    } );
  }
}
