import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, JobId, Queue } from 'bull';
import { Cache } from 'cache-manager';
import { I18nContext } from 'nestjs-i18n';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { FilterPaginationUtil, IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { NewsletterErrorsLocale } from 'src/i18n/locale-keys/newsletter/errors.locale';
import { NewsletterInfoLocale } from 'src/i18n/locale-keys/newsletter/info.locale';
import { SettingsService } from 'src/settings/settings.service';
import { SettingsKeyEnum } from 'src/settings/types/settings-key.enum';
import { Between, FindOptionsWhere, In, IsNull, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { SubscribersListQueryDto } from './dto/subscription/subscribers-list-query.dto';
import { SubscriptionTokenDto } from './dto/subscription/user/subscription-token.dto';
import { UnsubscribeReqDto } from './dto/subscription/user/unsubscribe-req.dto';
import { UnsubscribeDto } from './dto/subscription/user/unsubscribe.dto';
import { NewsletterCampaign } from './entities/newsletter-campaign.entity';
import { NewsletterSubscriber } from './entities/newsletter-subscriber.entity';
import { ISubscriptionEmailPayload } from './queues/consumers/subscription-token.consumer';
import { NewsletterJobs } from './queues/jobs.enum';
import { NewsletterQueues } from './queues/queues.enum';
import { AdminUpdateSubscriberDto } from './dto/subscription/admin-update-subscriber.dto';
import { NewsletterCreateCampaignDto } from './dto/campaigns/create-campain.dto';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { NewsletterCampaignListQueryDto } from './dto/campaigns/campaign-list-query.dto';
import { NewsletterUpdateCampaignDto } from './dto/campaigns/update-campaign.dto';
import { ICampaignPayload } from './queues/consumers/campaign.consumer';
import { NewsletterDelayedCampaignsJobs } from './types/service.type';
import { NewsletterCampaignJobsPaginationDto } from './dto/campaigns/campaign-jobs-pagination.dto';
import { AdminCreateSubscriberDto } from './dto/subscription/admin-create-subscriber.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FilesService } from 'src/files/files.service';
import { File, FilePolicyEnum, FileSectionEnum } from 'src/files/entities/file.entity';
import * as path from 'path';
import { sanitize } from 'string-sanitizer';
import { ConfigService } from '@nestjs/config';
import { InjectS3, S3 } from 'nestjs-s3';
import { EnvEnum } from 'src/env.enum';

@Injectable()
export class NewsletterService {
  constructor (
    @InjectRepository( NewsletterCampaign ) private readonly campaignRepo: Repository<NewsletterCampaign>,
    @InjectRepository( NewsletterSubscriber ) private readonly subscriberRepo: Repository<NewsletterSubscriber>,
    @InjectQueue( NewsletterQueues.SUBSCRIPTION_EMAIL ) private readonly subscriptionQueue: Queue<ISubscriptionEmailPayload>,
    @InjectQueue( NewsletterQueues.CAMPAIGN ) private readonly campaignQueue: Queue<ICampaignPayload>,
    private readonly filesService: FilesService,
    private readonly settingsService: SettingsService,
    private readonly configService: ConfigService,
    @InjectS3() private readonly s3: S3,
    @Inject( CACHE_MANAGER ) private readonly cacheManager: Cache
  ) { }

  //*********************************** Subscribers Region *************************************//

  // Subscribe
  async subscribe ( createSubscriberDto: AdminCreateSubscriberDto, i18n: I18nContext ) {
    const expTimeInMins = +( await this.settingsService.findOne( SettingsKeyEnum.NEWSLETTER_SUBSCRIPTION_TOKEN_EXP_IN_MINS ) ).value ?? 2;
    const tokenExpiresAt = new Date( Date.now() + ( expTimeInMins * 60_000 ) );

    const duplicate = await this.subscriberRepo.findOne( {
      where: { email: createSubscriberDto.email }
    } );

    if ( duplicate ) {

      if ( duplicate.approved ) throw new BadRequestException( i18n.t( NewsletterErrorsLocale.ALREADY_SUBSCRIBED ) );

      const oneMinAfterNow = Date.now() + 60_000;
      if ( !duplicate.approved ) {
        if ( duplicate.tokenExpiresAt.getTime() > oneMinAfterNow ) {
          return duplicate;
        }
        duplicate.token = this.sixDigitTokenGenerator();
        duplicate.tokenExpiresAt = tokenExpiresAt;
        const duplicateUpdateResult = await this.subscriberRepo.save( duplicate );
        await this.cacheManager.reset();
        await this.subscriptionQueue.add(
          NewsletterJobs.SUBSCRIBE_EMAIL,
          { email: duplicate.email, token: duplicateUpdateResult.token }
        );

        return duplicate;
      }
    }

    const subscriber = this.subscriberRepo.create( {
      ...createSubscriberDto,
      token: this.sixDigitTokenGenerator(),
      tokenExpiresAt,
    } );
    const result = await this.subscriberRepo.save( subscriber );
    await this.cacheManager.reset();

    if ( !createSubscriberDto.approved ) {
      await this.subscriptionQueue.add(
        NewsletterJobs.SUBSCRIBE_EMAIL,
        { email: subscriber.email, token: subscriber.token }
      );
    }

    return result;
  }

  // Update subscriber
  async updateSubscriber ( id: string, adminUpdateSubscriberDto: AdminUpdateSubscriberDto, i18n: I18nContext ) {
    const subscriber = await this.findOneSubscriberById( id, i18n );
    Object.assign( subscriber, adminUpdateSubscriberDto );
    const result = await this.subscriberRepo.save( subscriber );
    await this.cacheManager.reset();

    return result;
  }

  // Approve subscription
  async approveSubscription ( subscriptionTokenDto: SubscriptionTokenDto, i18n: I18nContext ) {
    const subscriber = await this.findOneSubscriberByEmail( subscriptionTokenDto.email, i18n );
    if ( subscriber.approved ) {
      throw new BadRequestException( i18n.t( NewsletterErrorsLocale.ALREADY_APPROVED ) );
    }
    if ( subscriber.token !== subscriptionTokenDto.token || subscriber.isTokenExpired ) {
      throw new BadRequestException( i18n.t( NewsletterErrorsLocale.TOKEN_EXPIRED_INCORRECT ) );
    }

    subscriber.approved = true;
    const result = await this.subscriberRepo.save( subscriber );
    await this.cacheManager.reset();

    return result;
  }

  // Issue token to unsubscribe
  async unsubscribeReq ( unsubscribeReqDto: UnsubscribeReqDto, i18n: I18nContext ) {
    const subscriber = await this.findOneSubscriberByEmail( unsubscribeReqDto.email, i18n );
    const expTimeInMins = +( await this.settingsService.findOne( SettingsKeyEnum.NEWSLETTER_SUBSCRIPTION_TOKEN_EXP_IN_MINS ) ).value ?? 2;
    const expiresAt = Date.now() + ( expTimeInMins * 60_000 );
    const oneMinAfterNow = Date.now() + 60_000;
    if ( !subscriber.isTokenExpired ) {
      if ( subscriber.tokenExpiresAt.getTime() > oneMinAfterNow ) {
        return subscriber;
      }

      subscriber.token = this.sixDigitTokenGenerator();
      subscriber.tokenExpiresAt = new Date( expiresAt );
      const updatedTokenSubscriber = await this.subscriberRepo.save( subscriber );
      await this.cacheManager.reset();
      await this.subscriptionQueue.add(
        NewsletterJobs.UNSUBSCRIBE_EMAIL,
        { email: subscriber.email, token: updatedTokenSubscriber.token }
      );

      return updatedTokenSubscriber;
    }
    subscriber.token = this.sixDigitTokenGenerator();
    subscriber.tokenExpiresAt = new Date( expiresAt );
    const result = await this.subscriberRepo.save( subscriber );
    await this.cacheManager.reset();
    await this.subscriptionQueue.add(
      NewsletterJobs.UNSUBSCRIBE_EMAIL,
      { email: subscriber.email, token: subscriber.token }
    );
    return result;
  }

  // Unsubscribe subscriber
  async unsubscribe ( unsubscribeDto: UnsubscribeDto, i18n: I18nContext ) {
    const subscriber = await this.findOneSubscriberByEmail( unsubscribeDto.email, i18n );

    if ( subscriber.token !== unsubscribeDto.token || subscriber.isTokenExpired ) {
      throw new BadRequestException( i18n.t( NewsletterErrorsLocale.TOKEN_EXPIRED_INCORRECT ) );
    }

    await this.subscriberRepo.remove( subscriber );
    await this.cacheManager.reset();
    return subscriber;
  }

  // Find a subscriber by Id
  async findOneSubscriberById ( id: string, i18n: I18nContext, withDeleted: boolean = false ): Promise<NewsletterSubscriber> {
    const subscriber = await this.subscriberRepo.findOne( {
      where: { id },
      withDeleted
    } );
    if ( !subscriber ) throw new NotFoundLocalizedException( i18n, NewsletterInfoLocale.TERM_SUBSCRIBER );

    return subscriber;
  }

  // Find a subscriber by email
  async findOneSubscriberByEmail ( email: string, i18n: I18nContext ): Promise<NewsletterSubscriber> {
    const subscriber = await this.subscriberRepo.findOne( {
      where: { email }
    } );
    if ( !subscriber ) throw new NotFoundLocalizedException( i18n, NewsletterInfoLocale.TERM_SUBSCRIBER );

    return subscriber;
  }

  async findAllSubscribers ( query: SubscribersListQueryDto ): Promise<IListResultGenerator<NewsletterSubscriber>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    // Get the result from database
    const [ items, totalItems ] = await this.subscriberRepo.findAndCount( {
      where: {
        name: query[ 'searchBy.name' ],
        email: query[ 'searchBy.email' ],
        approved: query[ 'filterBy.approved' ]
      },
      order: {
        name: query[ 'orderBy.name' ],
        email: query[ 'orderBy.email' ],
        approved: query[ 'orderBy.approved' ],
        createdAt: query[ 'orderBy.createdAt' ],
        updatedAt: query[ 'orderBy.updatedAt' ]
      },
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  async softRemoveSubscriber ( id: string, i18n: I18nContext ) {
    const subscriber = await this.findOneSubscriberById( id, i18n );
    const result = await this.subscriberRepo.softRemove( subscriber );
    await this.cacheManager.reset();

    return result;
  }

  async softRemoveAllSubscribers ( ids: string[] ): Promise<NewsletterSubscriber[]> {
    const subscribers = await this.subscriberRepo.find( { where: { id: In( ids ) } } );

    const result = await this.subscriberRepo.softRemove( subscribers );
    await this.cacheManager.reset();
    return result;
  }

  async softRemovedSubscribersFindAll ( query: PaginationDto ): Promise<IListResultGenerator<NewsletterSubscriber>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    const [ items, totalItems ] = await this.subscriberRepo.findAndCount( {
      withDeleted: true,
      where: { deletedAt: Not( IsNull() ) },
      order: { deletedAt: { direction: 'DESC' } },
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  async recoverSubscriber ( id: string, i18n: I18nContext ) {
    const subscriber = await this.findOneSubscriberById( id, i18n, true );
    const result = await this.subscriberRepo.recover( subscriber );
    await this.cacheManager.reset();

    return result;
  }

  async removeSubscriber ( id: string, i18n: I18nContext ) {
    const subscriber = await this.findOneSubscriberById( id, i18n, true );
    const result = await this.subscriberRepo.remove( subscriber );
    await this.cacheManager.reset();

    return result;
  }

  async removeSubscribersAll ( ids: string[] ): Promise<NewsletterSubscriber[]> {
    const subscribers = await this.subscriberRepo.find( { where: { id: In( ids ) }, withDeleted: true } );

    const result = await this.subscriberRepo.remove( subscribers );
    await this.cacheManager.reset();

    return result;
  }

  async emptySubscribersTrash (): Promise<void> {
    const softDeletedSubscribers = await this.subscriberRepo.find( {
      where: { deletedAt: Not( IsNull() ) },
      withDeleted: true
    } );

    await this.subscriberRepo.remove( softDeletedSubscribers );
    await this.cacheManager.reset();
  }

  //*********************************** Campaigns Region *************************************//

  // Create new campaign
  async createCampaign (
    createCampaignDto: NewsletterCreateCampaignDto,
    i18n: I18nContext,
    metadata: IMetadataDecorator ): Promise<NewsletterCampaign> {
    const duplicate = await this.campaignRepo.findOne( {
      where: { name: createCampaignDto.name }
    } );
    if ( duplicate ) throw new BadRequestException( i18n.t( NewsletterErrorsLocale.DUPLICATE_CAMPAIGN_NAME ) );

    const campaign = this.campaignRepo.create( {
      ...createCampaignDto,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    } );

    const result = await this.campaignRepo.save( campaign );
    await this.cacheManager.reset();

    this.campaignQueue.add(
      NewsletterJobs.CAMPAIGN,
      {
        id: result.id,
        name: result.name,
        emailSubject: result.emailSubject,
        content: result.content,
        sendToSubscribers: result.sendToSubscribers,
        sendToUsers: result.sendToUsers,
        sendingTime: result.sendingTime
      },
      {
        delay: result.sendingTime.getTime() - Date.now()
      }
    );

    return result;
  }

  // Find all campaigns
  async findAllCampaigns ( query: NewsletterCampaignListQueryDto ): Promise<IListResultGenerator<NewsletterCampaign>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );
    const where: FindOptionsWhere<NewsletterCampaign> = {
      name: query[ 'searchBy.name' ],
      description: query[ 'searchBy.description' ],
      emailSubject: query[ 'searchBy.emailSubject' ],
      sendToSubscribers: query[ 'filterBy.sendToSubscribers' ],
      sendToUsers: query[ 'filterBy.sendToUsers' ],
      sendingTime: query[ 'filterBy.sendingTime' ]?.length
        ? Between( query[ 'filterBy.sendingTime' ][ 0 ], query[ 'filterBy.sendingTime' ][ 1 ] )
        : undefined,
      createdAt: query[ 'filterBy.createdAt' ]?.length
        ? Between( query[ 'filterBy.createdAt' ][ 0 ], query[ 'filterBy.createdAt' ][ 1 ] )
        : undefined,
      updatedAt: query[ 'filterBy.updatedAt' ]?.length
        ? Between( query[ 'filterBy.updatedAt' ][ 0 ], query[ 'filterBy.updatedAt' ][ 1 ] )
        : undefined,
    };

    // Add sending failed number filter
    if ( query[ 'filterBy.sendingFailedTrackingNumGte' ] ) {
      where.sendingFailedTrackingNum = MoreThanOrEqual( query[ 'filterBy.sendingFailedTrackingNumGte' ] );
    }

    // Get the result from database
    const [ items, totalItems ] = await this.campaignRepo.findAndCount( {
      where,
      order: {
        name: query[ 'orderBy.name' ],
        description: query[ 'orderBy.description' ],
        emailSubject: query[ 'orderBy.emailSubject' ],
        sendingTime: query[ 'orderBy.sendingTime' ],
        sendToSubscribers: query[ 'orderBy.sendToSubscribers' ],
        sendToUsers: query[ 'orderBy.sendToUsers' ],
        createdAt: query[ 'orderBy.createdAt' ],
        updatedAt: query[ 'orderBy.updatedAt' ]
      },
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  // Find one campaign
  async findOneCampaign ( id: string, i18n: I18nContext, withDeleted: boolean = false ): Promise<NewsletterCampaign> {
    const campaign = await this.campaignRepo.findOne( {
      where: { id },
      withDeleted
    } );
    if ( !campaign ) throw new NotFoundLocalizedException( i18n, NewsletterInfoLocale.TERM_CAMPAIGN );

    return campaign;
  }

  // Update a campaign
  async updateCampaign (
    id: string,
    updateCampaignDto: NewsletterUpdateCampaignDto,
    i18n: I18nContext,
    metadata: IMetadataDecorator ): Promise<NewsletterCampaign> {
    const campaign = await this.findOneCampaign( id, i18n );
    if ( updateCampaignDto?.name !== campaign.name ) {
      const duplicateName = await this.campaignRepo.findOne( {
        where: { name: updateCampaignDto.name }
      } );
      if ( duplicateName ) throw new BadRequestException( i18n.t( NewsletterErrorsLocale.DUPLICATE_CAMPAIGN_NAME ) );
    }

    Object.assign( campaign, updateCampaignDto );
    campaign.ipAddress = metadata.ipAddress;
    campaign.userAgent = metadata.userAgent;

    const result = await this.campaignRepo.save( campaign );
    await this.cacheManager.reset();

    if ( updateCampaignDto.sendingTime !== campaign.sendingTime ) {
      const delayedJobs = await this.campaignQueue.getDelayed();
      const jobsToDelete = delayedJobs.filter( j => j.data.id === campaign.id );
      if ( jobsToDelete && jobsToDelete.length > 0 ) {
        const deletePromises = jobsToDelete.map( j => j.remove() );
        await Promise.all( deletePromises );
      }

      this.campaignQueue.add(
        NewsletterJobs.CAMPAIGN,
        {
          id: result.id,
          name: result.name,
          emailSubject: result.emailSubject,
          content: result.content,
          sendToSubscribers: result.sendToSubscribers,
          sendToUsers: result.sendToUsers,
          sendingTime: result.sendingTime
        },
        {
          delay: result.sendingTime.getTime() - Date.now()
        }
      );
    }

    return result;
  }

  // Soft remove a campaign
  async softRemoveCampaign ( id: string, i18n: I18nContext ): Promise<NewsletterCampaign> {
    const campaign = await this.findOneCampaign( id, i18n );

    const delayedJobs = await this.campaignQueue.getDelayed();
    const jobsToDelete = delayedJobs.filter( j => j.data.id === campaign.id );
    if ( jobsToDelete && jobsToDelete.length > 0 ) {
      const deletePromises = jobsToDelete.map( j => j.remove() );
      await Promise.all( deletePromises );
    }

    const result = await this.campaignRepo.softRemove( campaign );
    await this.cacheManager.reset();

    return result;
  }

  async softRemoveAllCampaigns ( ids: string[] ): Promise<NewsletterCampaign[]> {
    const campaigns = await this.campaignRepo.find( { where: { id: In( ids ) } } );

    const deleteJobsPromises = campaigns.map( async c => {
      const delayedJobs = await this.campaignQueue.getDelayed();
      const jobsToDelete = delayedJobs.filter( j => j.data.id === c.id );
      if ( jobsToDelete && jobsToDelete.length > 0 ) {
        const deletePromises = jobsToDelete.map( j => j.remove() );
        await Promise.all( deletePromises );
      }
    } );

    await Promise.all( deleteJobsPromises );

    const result = await this.campaignRepo.softRemove( campaigns );
    await this.cacheManager.reset();
    return result;
  }

  async softRemovedCampaignsFindAll ( query: PaginationDto ): Promise<IListResultGenerator<NewsletterCampaign>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    const [ items, totalItems ] = await this.campaignRepo.findAndCount( {
      withDeleted: true,
      where: { deletedAt: Not( IsNull() ) },
      order: { deletedAt: { direction: 'DESC' } },
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  async recoverCampaign ( id: string, i18n: I18nContext ): Promise<NewsletterCampaign> {
    const campaign = await this.findOneCampaign( id, i18n, true );
    const result = await this.campaignRepo.recover( campaign );
    await this.cacheManager.reset();

    return result;
  }

  // Remove a campaign permanently
  async removeCampaign ( id: string, i18n: I18nContext ): Promise<NewsletterCampaign> {
    const campaign = await this.findOneCampaign( id, i18n, true );

    const delayedJobs = await this.campaignQueue.getDelayed();
    const jobsToDelete = delayedJobs.filter( j => j.data.id === campaign.id );
    if ( jobsToDelete && jobsToDelete.length > 0 ) {
      const deletePromises = jobsToDelete.map( j => j.remove() );
      await Promise.all( deletePromises );
    }

    const result = await this.campaignRepo.remove( campaign );
    await this.cacheManager.reset();

    return result;
  }

  async removeCampaignsAll ( ids: string[] ): Promise<NewsletterCampaign[]> {
    const campaigns = await this.campaignRepo.find( { where: { id: In( ids ) }, withDeleted: true } );

    const deleteJobsPromises = campaigns.map( async c => {
      const delayedJobs = await this.campaignQueue.getDelayed();
      const jobsToDelete = delayedJobs.filter( j => j.data.id === c.id );
      if ( jobsToDelete && jobsToDelete.length > 0 ) {
        const deletePromises = jobsToDelete.map( j => j.remove() );
        await Promise.all( deletePromises );
      }
    } );

    await Promise.all( deleteJobsPromises );

    const result = await this.campaignRepo.remove( campaigns );
    await this.cacheManager.reset();

    return result;
  }

  async emptyCampaignsTrash (): Promise<void> {
    const softDeletedCampaigns = await this.campaignRepo.find( {
      withDeleted: true,
      where: { deletedAt: Not( IsNull() ) },
    } );

    const deleteJobsPromises = softDeletedCampaigns.map( async c => {
      const delayedJobs = await this.campaignQueue.getDelayed();
      const jobsToDelete = delayedJobs.filter( j => j.data.id === c.id );
      if ( jobsToDelete && jobsToDelete.length > 0 ) {
        const deletePromises = jobsToDelete.map( j => j.remove() );
        await Promise.all( deletePromises );
      }
    } );

    await Promise.all( deleteJobsPromises );

    await this.campaignRepo.remove( softDeletedCampaigns );
    await this.cacheManager.reset();
  }

  // Find all campaign delayed jobs
  async findAllCampaignDelayedJobs ( campaignJobsPaginationDto: NewsletterCampaignJobsPaginationDto )
    : Promise<IListResultGenerator<NewsletterDelayedCampaignsJobs>> {
    const { page, limit } = campaignJobsPaginationDto;
    const delayed = await this.campaignQueue.getDelayed();
    return this.sortAndPaginateCampaignsJobs( delayed, page, limit );
  }

  // Find all campaign completed jobs
  async findAllCampaignCompletedJobs ( campaignJobsPaginationDto: NewsletterCampaignJobsPaginationDto )
    : Promise<IListResultGenerator<NewsletterDelayedCampaignsJobs>> {
    const { page, limit } = campaignJobsPaginationDto;
    const completedJobs = await this.campaignQueue.getCompleted();
    return this.sortAndPaginateCampaignsJobs( completedJobs, page, limit );
  }

  // Remove a campaign job
  async removeCampaignJob ( jobId: JobId, i18n: I18nContext ): Promise<Job<ICampaignPayload>> {
    const job = await this.campaignQueue.getJob( jobId );
    if ( !job ) throw new NotFoundLocalizedException( i18n, NewsletterInfoLocale.TERM_CAMPAIGN_JOB );
    await job.remove();
    return job;
  }

  // Upload Image for Email Template
  async uploadImg ( img: Express.Multer.File, i18n: I18nContext, metadata: IMetadataDecorator ): Promise<File> {
    const rawFileName = path.parse( img.originalname ).name;
    const fileExt = path.parse( img.originalname ).ext;

    const rootFolderName = "public";
    // Sanitizing 
    const sanitizedFileName = sanitize.addUnderscore( rawFileName );
    // Compute full filename
    const fullFileName = `${ rootFolderName }/GENERAL/${ sanitizedFileName }_${ Date.now() }${ fileExt }`;
    await this.s3.upload( {
      Bucket: this.configService.getOrThrow( EnvEnum.S3_BUCKET ),
      Key: fullFileName,
      Body: img.buffer,
      ContentType: img.mimetype,
      ACL: "public-read",
    } ).promise();

    const file = await this.filesService.create(
      {
        filename: img.originalname,
        key: fullFileName,
        policy: FilePolicyEnum.PUBLIC_READ,
        section: FileSectionEnum.GENERAL,
        size: img.size, type:
          img.mimetype,
        imageAlt: 'Email Photo'
      },
      i18n,
      metadata,
      false
    );

    return file;
  }

  /********************************************************************************************/
  /********************************** Helper Methods ******************************************/
  /*********************************** Start Region *******************************************/
  /********************************************************************************************/

  /**
   * Generate 6-digit token
   * @returns Six-digit token
   */
  sixDigitTokenGenerator () {
    return Math.floor( 100_000 + Math.random() * 900_000 );
  }

  /**
   * Sort and paginate campaign queued jobs
   * @param jobs - Bull jobs of the type {@link ICampaignPayload}
   * @param page - Number of current page
   * @param size - Items per page
   * @returns Sorted and paginated campaign jobs
   */
  sortAndPaginateCampaignsJobs ( jobs: Job<ICampaignPayload>[], page: number = 1, size: number = 10 )
    : IListResultGenerator<NewsletterDelayedCampaignsJobs> {
    jobs.sort( ( a, b ) => parseInt( b.id.toString() ) - parseInt( a.id.toString() ) );

    const total = jobs.length;
    const totalPages = Math.ceil( total / size );

    let pageVal = 1;
    if ( page < 1 ) { pageVal = 1; }
    else if ( page > totalPages ) { pageVal = totalPages > 0 ? totalPages : 1; }
    else { pageVal = page ? page : 1; }

    let sizeVal = 10;
    if ( size < 1 ) { sizeVal = 10; }
    else if ( size > 100 ) { sizeVal = 100; }
    else { sizeVal = size ? size : 10; }

    const startIndex = ( pageVal - 1 ) * sizeVal;
    const endIndex = startIndex + sizeVal;
    const jobsSlice = jobs.slice( startIndex, endIndex );
    const currentPageResultsNumber = jobsSlice.length;

    const data = jobsSlice.map( j => {
      return {
        jobId: j.id,
        name: j.data.name,
        emailSubject: j.data.emailSubject,
      };
    } );

    return {
      meta: {
        totalPages,
        currentPage: pageVal,
        itemCount: currentPageResultsNumber,
        totalItems: total,
        itemsPerPage: sizeVal,
      },
      items: data
    };
  }

  /********************************************************************************************/
  /************************************ End Region ********************************************/
  /********************************** Helper Methods ******************************************/
  /********************************************************************************************/
}
