import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { ILayout, LayoutDto } from './common/dto/layout.dto';
import { Serialize } from './common/interceptors/serialize.interceptor';
import { FilesService } from './files/files.service';
import { WidgetTypeEnum } from './posts/entities/post.entity';
import { PostsService } from './posts/posts.service';
import { SettingsService } from './settings/settings.service';
import { SettingsKeyEnum } from './settings/types/settings-key.enum';
import { SettingsServiceEnum } from './settings/types/settings-service.enum';
import { TaxonomiesService } from './taxonomies/taxonomies.service';
import * as osu from 'node-os-utils';
import { JwtAuthGuard } from './users/guards/jwt.guard';
import { PermissionsGuard } from './users/guards/require-permissions.guard';
import { RequirePermission } from './users/decorators/require-permission.decorator';
import { PermissionsEnum } from './common/security/permissions.enum';
import { DashboardPostsStatsDto, DashboardSystemStatsDto } from './common/dto/dashboard-system-stats.dto';

@Controller()
export class AppController {
  constructor (
    private readonly appService: AppService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly filesService: FilesService,
    private readonly postsService: PostsService,
    private readonly settingsService: SettingsService
  ) { }

  @Get( 'layout-data' )
  @Serialize( LayoutDto )
  async getLayout (): Promise<ILayout> {
    const primaryMenuItems = await this.taxonomiesService.getPrimaryMenuItems();
    const secondaryMenuItems = await this.taxonomiesService.getSecondaryMenuItems();
    const siteLogos = await this.filesService.getSiteLogos();
    const heroSectionData = await this.postsService.findAllWidgetsByType( WidgetTypeEnum.HERO_WIDGET );
    const serviceSectionData = await this.postsService.findAllWidgetsByType( WidgetTypeEnum.SERVICE_WIDGET );
    const contactWidgetData = await this.postsService.findAllWidgetsByType( WidgetTypeEnum.CONTACT_WIDGET );
    const linksWidgetData = await this.postsService.findAllWidgetsByType( WidgetTypeEnum.LINKS_WIDGET );
    const newsletterWidgetData = await this.postsService.findAllWidgetsByType( WidgetTypeEnum.NEWSLETTER_WIDGET );
    const generalSettings = await this.settingsService.findAll( { settingService: SettingsServiceEnum.GENERAL } );
    const siteName = generalSettings.find( gs => gs.key === SettingsKeyEnum.SITE_NAME ).value ?? null;
    const siteDescription = generalSettings.find( gs => gs.key === SettingsKeyEnum.SITE_DESCRIPTION ).value ?? null;
    const siteURL = generalSettings.find( gs => gs.key === SettingsKeyEnum.SITE_URL ).value ?? null;

    return {
      primaryMenuItems,
      secondaryMenuItems,
      siteName,
      siteDescription,
      siteURL,
      siteLogos,
      heroSectionData,
      serviceSectionData,
      contactWidgetData,
      linksWidgetData,
      newsletterWidgetData
    };
  }

  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.DASHBOARD_READ )
  @Get( 'admin/dashboard/system-stats' )
  @Serialize( DashboardSystemStatsDto )
  async adminDashboardSystemStats (): Promise<DashboardSystemStatsDto> {
    const cpuUsagePercentage = await osu.cpu.usage();
    const memoryUsage = await osu.mem.used();

    return {
      cpuUsagePercentage,
      memoryUsage
    };
  }

  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.DASHBOARD_READ )
  @Get( 'admin/dashboard/posts-stats' )
  @Serialize( DashboardPostsStatsDto )
  async adminDashboardPostsStats (): Promise<DashboardPostsStatsDto> {
    const blogsNumber = await this.postsService.allBlogsNumber();
    const newsNumber = await this.postsService.allNewsNumber();
    const projectsNumber = await this.postsService.allProjectsNumber();

    return {
      blogsNumber,
      newsNumber,
      projectsNumber
    };
  }
}
