import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { CommonErrorsLocale } from 'src/i18n/locale-keys/common/errors.locale';
import { SettingsService } from 'src/settings/settings.service';
import { SettingsKeyEnum } from 'src/settings/types/settings-key.enum';
import { EmailContactUsDto } from './dto/contact-us.dto';
import { SendEmailDto } from './dto/send-email.dto';
import * as path from 'path';
import { PostsService } from 'src/posts/posts.service';
import { FilesService } from 'src/files/files.service';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { sanitize } from 'string-sanitizer';
import { ConfigService } from '@nestjs/config';
import { InjectS3, S3 } from 'nestjs-s3';
import { EnvEnum } from 'src/env.enum';
import { File, FilePolicyEnum, FileSectionEnum } from 'src/files/entities/file.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Email } from './entities/email.entity';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { EmailInfoLocale } from 'src/i18n/locale-keys/email/info.locale';
import { EmailListQueryDto } from './dto/email-list-query.dto';
import { FilterPaginationUtil, IListResultGenerator } from 'src/common/utils/filter-pagination.utils';

@Injectable()
export class EmailsService {
  constructor (
    @InjectRepository( Email ) private readonly emailRepo: Repository<Email>,
    @Inject( CACHE_MANAGER ) private readonly cacheManager: Cache,
    private readonly mailerService: MailerService,
    private readonly settingsService: SettingsService,
    private readonly postsService: PostsService,
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
    @InjectS3() private readonly s3: S3,
  ) { }
  // Send and store email
  async sendMail ( sendEmailDto: SendEmailDto ) {

    const email = this.emailRepo.create( {
      ...sendEmailDto,
      to: sendEmailDto.to.join( ',' ),
      cc: sendEmailDto.cc.join( ',' ),
      bcc: sendEmailDto.bcc.join( ',' )
    } );
    await this.emailRepo.save( email );
    await this.cacheManager.reset();

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

  // Find a stored email
  async findOneEmail ( id: string, i18n: I18nContext, withDeleted: boolean = false ): Promise<Email> {
    const email = await this.emailRepo.findOne( {
      where: { id },
      withDeleted
    } );
    if ( !email ) throw new NotFoundLocalizedException( i18n, EmailInfoLocale.TERM_EMAIL );

    return email;
  }

  // Find all sent emails
  async findAllSentEmails ( query: EmailListQueryDto ): Promise<IListResultGenerator<Email>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );
    const where: FindOptionsWhere<Email> = {
      from: query[ 'searchBy.from' ],
      to: query[ 'searchBy.to' ],
      subject: query[ 'searchBy.subject' ],
    };

    // Get the result from database
    const [ items, totalItems ] = await this.emailRepo.findAndCount( {
      where,
      order: {
        createdAt: query[ 'orderBy.createdAt' ],
      },
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  // Remove a campaign permanently
  async removeSentEmail ( id: string, i18n: I18nContext ): Promise<Email> {
    const email = await this.findOneEmail( id, i18n, true );

    const result = await this.emailRepo.remove( email );
    await this.cacheManager.reset();

    return result;
  }

  async removeSentEmailsAll ( ids: string[] ): Promise<Email[]> {
    const email = await this.emailRepo.find( { where: { id: In( ids ) }, withDeleted: true } );

    const result = await this.emailRepo.remove( email );
    await this.cacheManager.reset();

    return result;
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
    const customTemplateId = ( await this.settingsService.findOneOrNull( SettingsKeyEnum.SITE_CONTACT_AUTO_RESPONSE_TEMPLATE_ID ) )?.value;
    const customTemplate = customTemplateId ? await this.postsService.findOneOrNull( customTemplateId ) : null;

    const websiteName = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_NAME ) ).value;
    const websiteUrl = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_URL ) ).value;
    const subject = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_CONTACT_AUTO_RESPONSE_EMAIL_SUBJECT ) ).value;
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
}
