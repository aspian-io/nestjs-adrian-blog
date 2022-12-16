import { MailerService } from "@nestjs-modules/mailer";
import { Process, Processor } from "@nestjs/bull";
import { InjectRepository } from "@nestjs/typeorm";
import { Job } from "bull";
import { NewsletterCampaign } from "src/newsletter/entities/newsletter-campaign.entity";
import { NewsletterSubscriber } from "src/newsletter/entities/newsletter-subscriber.entity";
import { SettingsService } from "src/settings/settings.service";
import { SettingsKeyEnum } from "src/settings/types/settings-key.enum";
import { Repository } from "typeorm";
import { NewsletterJobs } from "../jobs.enum";
import { NewsletterQueues } from "../queues.enum";
import * as Handlebars from 'handlebars';
import { UsersService } from "src/users/users.service";

export interface ICampaignPayload {
  id: string;
  name: string;
  emailSubject: string;
  content: string;
  sendToSubscribers: boolean;
  sendToUsers: boolean;
  sendingTime: Date;
}

@Processor( NewsletterQueues.CAMPAIGN )
export class CampaignJobsConsumer {
  constructor (
    @InjectRepository( NewsletterCampaign ) private readonly campaignRepo: Repository<NewsletterCampaign>,
    @InjectRepository( NewsletterSubscriber ) private readonly subscriberRepo: Repository<NewsletterSubscriber>,
    private readonly usersService: UsersService,
    private readonly settingsService: SettingsService,
    private readonly mailerService: MailerService
  ) { }
  @Process( NewsletterJobs.CAMPAIGN )
  async processCampaign ( job: Job<ICampaignPayload> ) {
    try {
      const compiledTemplate = Handlebars.compile( job.data.content );
      const canSpam = ( await this.settingsService.findOne( SettingsKeyEnum.NEWSLETTER_CAN_SPAM ) )?.value;
      const company = ( await this.settingsService.findOne( SettingsKeyEnum.NEWSLETTER_COMPANY ) )?.value;
      const companyLogo = ( await this.settingsService.findOne( SettingsKeyEnum.NEWSLETTER_COMPANY_LOGO_LINK ) )?.value;
      const copyright = ( await this.settingsService.findOne( SettingsKeyEnum.NEWSLETTER_COPYRIGHT ) )?.value;
      const homePage = ( await this.settingsService.findOne( SettingsKeyEnum.NEWSLETTER_HOMEPAGE ) )?.value;
      const address = ( await this.settingsService.findOne( SettingsKeyEnum.NEWSLETTER_ADDRESS ) )?.value;
      const from = ( await this.settingsService.findOne( SettingsKeyEnum.NEWSLETTER_SENDING_FROM ) )?.value;
      if ( job.data.sendToSubscribers ) {
        const subscribers = await this.subscriberRepo.find();
        subscribers.map( async s => {

          const html = compiledTemplate( {
            name: s.name,
            email: s.email,
            can_spam: canSpam,
            company,
            company_logo: companyLogo,
            copyright,
            home_page: homePage,
            address,
          } );

          try {
            await this.mailerService.sendMail( {
              from,
              to: s.email,
              subject: job.data.emailSubject,
              html,
            } );
          } catch ( error ) {
            const campaign = await this.campaignRepo.findOne( { where: { id: job.data.id } } );
            if ( campaign ) {
              campaign.sendingFailedTrackingNum++;
              await this.campaignRepo.save( campaign );
            }
          }
        } );
      }

      if ( job.data.sendToUsers ) {
        const users = await this.usersService.findAllWithVerifiedEmails();
        users.map( async u => {

          const html = compiledTemplate( {
            name: u.firstName,
            email: u.email,
            can_spam: canSpam,
            company,
            company_logo: companyLogo,
            copyright,
            home_page: homePage,
            address,
          } );

          try {
            await this.mailerService.sendMail( {
              from,
              to: u.email,
              subject: job.data.emailSubject,
              html,
            } );
          } catch ( error ) {
            const campaign = await this.campaignRepo.findOne( { where: { id: job.data.id } } );
            if ( campaign ) {
              campaign.sendingFailedTrackingNum++;
              await this.campaignRepo.save( campaign );
            }
          }
        } );
      }

    } catch ( error ) {
      console.log( "Something went wrong processing campaign", error );
    }
  }
}