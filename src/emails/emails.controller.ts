import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Get, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Query, Param, Delete } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { SendEmailDto } from './dto/send-email.dto';
import { JwtAuthGuard } from 'src/users/guards/jwt.guard';
import { RequirePermission } from 'src/users/decorators/require-permission.decorator';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { EmailContactUsDto } from './dto/contact-us.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { PermissionsGuard } from 'src/users/guards/require-permissions.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { IMetadataDecorator, Metadata } from 'src/common/decorators/metadata.decorator';
import { File } from 'src/files/entities/file.entity';
import { IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { Email } from './entities/email.entity';
import { EmailListQueryDto } from './dto/email-list-query.dto';
import { Recaptcha } from '@nestlab/google-recaptcha';

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

  @Post( 'admin/emails/templates/upload-img' )
  @UseGuards( JwtAuthGuard )
  @UseInterceptors( FileInterceptor( 'img' ) )
  UploadImg (
    @UploadedFile( new ParseFilePipe( {
      validators: [
        new MaxFileSizeValidator( { maxSize: 1024 * 1024 * 5 } ),
        new FileTypeValidator( { fileType: /(.jpeg|.png|.gif)/ } )
      ]
    } ) ) img: Express.Multer.File,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator
  ): Promise<File> {
    return this.emailsService.uploadImg( img, i18n, metadata );
  }

  @Get( 'admin/emails/all-sent-emails' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.EMAIL_READ )
  findAllSentEmails ( @Query() query: EmailListQueryDto ): Promise<IListResultGenerator<Email>> {
    return this.emailsService.findAllSentEmails( query );
  }

  @Get( 'admin/emails/sent/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.EMAIL_READ )
  findOneEmail ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.emailsService.findOneEmail( id, i18n );
  }

  @Delete( 'admin/emails/sent/permanent-delete/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.EMAIL_DELETE )
  removeSentEmail ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ) {
    return this.emailsService.removeSentEmail( id, i18n );
  }

  @Delete( 'admin/emails/sent/permanent-delete-all' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.EMAIL_DELETE )
  removeAllSentEmails ( @Body( 'ids' ) ids: string[] ): Promise<Email[]> {
    return this.emailsService.removeSentEmailsAll( ids );
  }

  @Post( 'contact-us' )
  @HttpCode( HttpStatus.OK )
  @Recaptcha( { action: 'contact' } )
  contactUs ( @Body() dto: EmailContactUsDto, @I18n() i18n: I18nContext ) {
    return this.emailsService.contactUs( dto, i18n );
  }
}
