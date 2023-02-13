import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ILayout, LayoutDto } from './common/dto/layout.dto';
import { Serialize } from './common/interceptors/serialize.interceptor';
import { FilesService } from './files/files.service';
import { WidgetTypeEnum } from './posts/entities/post.entity';
import { PostsService } from './posts/posts.service';
import { TaxonomiesService } from './taxonomies/taxonomies.service';

@Controller()
export class AppController {
  constructor (
    private readonly appService: AppService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly filesService: FilesService,
    private readonly postsService: PostsService,
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

    return {
      primaryMenuItems,
      secondaryMenuItems,
      siteLogos,
      heroSectionData,
      serviceSectionData,
      contactWidgetData,
      linksWidgetData,
      newsletterWidgetData
    };
  }
}
