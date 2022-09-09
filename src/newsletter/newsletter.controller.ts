import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { RequirePermission } from 'src/users/decorators/require-permission.decorator';
import { JwtAuthGuard } from 'src/users/guards/jwt.guard';
import { PermissionsGuard } from 'src/users/guards/require-permissions.guard';
import { CreateSubscriberDto } from './dto/subscription/user/create-subscriber.dto';
import { SubscribersListQueryDto } from './dto/subscription/subscribers-list-query.dto';
import { SubscriptionTokenDto } from './dto/subscription/user/subscription-token.dto';
import { UnsubscribeReqDto } from './dto/subscription/user/unsubscribe-req.dto';
import { UnsubscribeDto } from './dto/subscription/user/unsubscribe.dto';
import { NewsletterSubscriber } from './entities/newsletter-subscriber.entity';
import { NewsletterService } from './newsletter.service';
import { AdminUpdateSubscriberDto } from './dto/subscription/admin-update-subscriber.dto';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { SubscriberDto } from './dto/subscription/user/subscriber.dto';
import { NewsletterCreateCampaignDto } from './dto/campaigns/create-campain.dto';
import { IMetadataDecorator, Metadata } from 'src/common/decorators/metadata.decorator';
import { NewsletterCampaign } from './entities/newsletter-campaign.entity';
import { NewsletterCampaignListQueryDto } from './dto/campaigns/campaign-list-query.dto';
import { NewsletterUpdateCampaignDto } from './dto/campaigns/update-campaign.dto';
import { NewsletterCampaignJobsPaginationDto } from './dto/campaigns/campaign-jobs-pagination.dto';

@Controller()
export class NewsletterController {
  constructor ( private readonly newsletterService: NewsletterService ) { }

  /*********************************** Subscribers Region *************************************/

  @Post( 'newsletter/subscribers/subscribe' )
  @Serialize( SubscriberDto )
  subscribe ( @Body() createSubscriberDto: CreateSubscriberDto, @I18n() i18n: I18nContext ) {
    return this.newsletterService.subscribe( createSubscriberDto, i18n );
  }

  @Post( 'newsletter/subscribers/approve-subscription' )
  @Serialize( SubscriberDto )
  approveSubscription (
    @Body() subscriptionTokenDto: SubscriptionTokenDto,
    @I18n() i18n: I18nContext
  ) {
    return this.newsletterService.approveSubscription( subscriptionTokenDto, i18n );
  }

  @Post( 'newsletter/subscribers/unsubscribe-request' )
  @Serialize( SubscriberDto )
  unsubscribeReq ( @Body() unsubscribeReqDto: UnsubscribeReqDto, @I18n() i18n: I18nContext ) {
    return this.newsletterService.unsubscribeReq( unsubscribeReqDto, i18n );
  }

  @Post( 'newsletter/subscribers/unsubscribe' )
  @Serialize( SubscriberDto )
  unsubscribe ( @Body() unsubscribeDto: UnsubscribeDto, @I18n() i18n: I18nContext ) {
    return this.newsletterService.unsubscribe( unsubscribeDto, i18n );
  }

  @Patch( 'admin/newsletter/subscribers/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_EDIT )
  updateSubscriber (
    @Param( 'id' ) id: string,
    @Body() adminUpdateSubscriberDto: AdminUpdateSubscriberDto,
    @I18n() i18n: I18nContext ): Promise<NewsletterSubscriber> {
    return this.newsletterService.updateSubscriber( id, adminUpdateSubscriberDto, i18n );
  }

  @Get( 'admin/newsletter/subscribers' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_READ )
  findAllSubscribers ( @Query() query: SubscribersListQueryDto ): Promise<IListResultGenerator<NewsletterSubscriber>> {
    return this.newsletterService.findAllSubscribers( query );
  }

  @Get( 'admin/newsletter/subscribers/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_READ )
  findOneSubscriber ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<NewsletterSubscriber> {
    return this.newsletterService.findOneSubscriberById( id, i18n );
  }

  @Delete( 'admin/newsletter/subscribers/soft-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_DELETE )
  softRemoveSubscriber ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.newsletterService.softRemoveSubscriber( id, i18n );
  }

  @Patch( 'admin/newsletter/subscribers/recover/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_DELETE )
  recoverSubscriber ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.newsletterService.recoverSubscriber( id, i18n );
  }

  @Delete( 'admin/newsletter/subscribers/permanent-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_DELETE )
  removeSubscriber ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.newsletterService.removeSubscriber( id, i18n );
  }

  /*********************************** Campaigns Region *************************************/

  @Post( 'admin/newsletter/campaigns' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_CREATE )
  createCampaign (
    @Body() createCampaignDto: NewsletterCreateCampaignDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator ): Promise<NewsletterCampaign> {
    return this.newsletterService.createCampaign( createCampaignDto, i18n, metadata );
  }

  @Get( 'admin/newsletter/campaigns' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_READ )
  findAllCampaigns ( @Query() query: NewsletterCampaignListQueryDto ): Promise<IListResultGenerator<NewsletterCampaign>> {
    return this.newsletterService.findAllCampaigns( query );
  }

  @Get( 'admin/newsletter/campaigns/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_READ )
  findOneCampaign ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.newsletterService.findOneCampaign( id, i18n );
  }

  @Patch( 'admin/newsletter/campaigns/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_EDIT )
  updateCampaign ( @Param( 'id' ) id: string,
    @Body() updateCampaignDto: NewsletterUpdateCampaignDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator ): Promise<NewsletterCampaign> {
    return this.newsletterService.updateCampaign( id, updateCampaignDto, i18n, metadata );
  }

  @Delete( 'admin/newsletter/campaigns/soft-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_DELETE )
  softRemoveCampaign ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.newsletterService.softRemoveCampaign( id, i18n );
  }

  @Patch( 'admin/newsletter/campaigns/recover/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_DELETE )
  recoverCampaign ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.newsletterService.recoverCampaign( id, i18n );
  }

  @Delete( 'admin/newsletter/campaigns/permanent-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_DELETE )
  removeCampaign ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.newsletterService.removeCampaign( id, i18n );
  }

  @Get( 'admin/newsletter/campaigns-jobs/delayed' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_READ )
  findAllCampaignDelayedJobs ( @Query() campaignJobsPaginationDto: NewsletterCampaignJobsPaginationDto ) {
    return this.newsletterService.findAllCampaignDelayedJobs( campaignJobsPaginationDto );
  }

  @Get( 'admin/newsletter/campaigns-jobs/completed' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_READ )
  findAllCampaignCompletedJobs ( @Query() campaignJobsPaginationDto: NewsletterCampaignJobsPaginationDto ) {
    return this.newsletterService.findAllCampaignCompletedJobs( campaignJobsPaginationDto );
  }

  @Delete( 'admin/newsletter/campaigns-jobs/delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.NEWSLETTER_DELETE )
  removeCampaignJob ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.newsletterService.removeCampaignJob( id, i18n );
  }
}
