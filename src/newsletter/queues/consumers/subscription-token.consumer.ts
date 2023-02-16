import { MailerService } from "@nestjs-modules/mailer";
import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { PostsService } from "src/posts/posts.service";
import { SettingsService } from "src/settings/settings.service";
import { SettingsKeyEnum } from "src/settings/types/settings-key.enum";
import { NewsletterJobs } from "../jobs.enum";
import { NewsletterQueues } from "../queues.enum";
import * as path from 'path';
import * as Handlebars from 'handlebars';

export interface ISubscriptionEmailPayload {
  email: string;
  token: number;
}

@Processor( NewsletterQueues.SUBSCRIPTION_EMAIL )
export class SubscriptionTokenJobsConsumer {
  constructor (
    private readonly postsService: PostsService,
    private readonly mailerService: MailerService,
    private readonly settingsService: SettingsService
  ) { }

  @Process( NewsletterJobs.SUBSCRIBE_EMAIL )
  async sendSubscribeEmail ( job: Job<ISubscriptionEmailPayload> ) {
    try {
      const defaultTemplatePath = path.join( __dirname, '../../templates/subscribe.template.hbs' );
      const customTemplateIdToFind = SettingsKeyEnum.NEWSLETTER_SUBSCRIBE_TEMPLATE_ID;
      await this.doProcess( customTemplateIdToFind, defaultTemplatePath, job.data.email, job.data.token );
    } catch ( error ) {
      console.log( "Something went wrong sending subscribe email", error );
    }
  }

  @Process( NewsletterJobs.UNSUBSCRIBE_EMAIL )
  async sendUnsubscribeEmail ( job: Job<ISubscriptionEmailPayload> ) {
    try {
      const defaultTemplatePath = path.join( __dirname, '../../templates/unsubscribe.template.hbs' );
      const customTemplateIdToFind = SettingsKeyEnum.NEWSLETTER_UNSUBSCRIBE_TEMPLATE_ID;
      await this.doProcess( customTemplateIdToFind, defaultTemplatePath, job.data.email, job.data.token );

    } catch ( error ) {
      console.log( "Something went wrong sending unsubscribe email", error );
    }
  }

  // Helper Methods
  private async doProcess (
    customTemplateIdToFind: SettingsKeyEnum.NEWSLETTER_SUBSCRIBE_TEMPLATE_ID | SettingsKeyEnum.NEWSLETTER_UNSUBSCRIBE_TEMPLATE_ID,
    defaultTemplatePath: string,
    email: string,
    token: number
  ) {
    const company = ( await this.settingsService.findOne( SettingsKeyEnum.NEWSLETTER_COMPANY ) )?.value;
    const copyright = ( await this.settingsService.findOne( SettingsKeyEnum.NEWSLETTER_COPYRIGHT ) )?.value;
    const address = ( await this.settingsService.findOne( SettingsKeyEnum.NEWSLETTER_ADDRESS ) )?.value;
    const customTemplateId = ( await this.settingsService.findOneOrNull( customTemplateIdToFind ) )?.value;
    const customTemplate = customTemplateId ? await this.postsService.findOne( customTemplateId ) : null;
    const websiteName = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_NAME ) ).value;
    const websiteUrl = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_URL ) ).value;
    const subject = ( await this.settingsService.findOne( SettingsKeyEnum.NEWSLETTER_SUBSCRIPTION_EMAIL_SUBJECT ) ).value;
    const siteSupportEmail = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_SUPPORT_EMAIL ) ).value;
    if ( customTemplate ) {
      const compiledTemplate = Handlebars.compile( customTemplate.content );
      const html = compiledTemplate( {
        websiteName,
        token,
        websiteUrl,
        email,
        company,
        copyright,
        address,
        year: new Date().getFullYear()
      } );
      return this.mailerService.sendMail( {
        from: siteSupportEmail,
        to: email,
        subject,
        html,
      } );
    }

    return this.mailerService.sendMail( {
      from: siteSupportEmail,
      to: email,
      subject,
      template: defaultTemplatePath,
      context: { websiteName, token, websiteUrl }
    } );
  }
}