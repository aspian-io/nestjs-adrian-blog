import { Module } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsletterCampaign } from './entities/newsletter-campaign.entity';
import { NewsletterSubscriber } from './entities/newsletter-subscriber.entity';
import { BullModule } from '@nestjs/bull';
import { NewsletterQueues } from './queues/queues.enum';
import { SubscriptionTokenJobsConsumer } from './queues/consumers/subscription-token.consumer';
import { PostsModule } from 'src/posts/posts.module';
import { CampaignJobsConsumer } from './queues/consumers/campaign.consumer';
import { UsersModule } from 'src/users/users.module';
import { FilesModule } from 'src/files/files.module';

@Module( {
  imports: [
    TypeOrmModule.forFeature( [
      NewsletterCampaign,
      NewsletterSubscriber,
    ] ),
    BullModule.registerQueue(
      { name: NewsletterQueues.SUBSCRIPTION_EMAIL },
      { name: NewsletterQueues.CAMPAIGN }
    ),
    PostsModule,
    FilesModule,
    UsersModule
  ],
  controllers: [ NewsletterController ],
  providers: [ NewsletterService, SubscriptionTokenJobsConsumer, CampaignJobsConsumer ]
} )
export class NewsletterModule { }
