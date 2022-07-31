import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { getTestMessageUrl } from 'nodemailer';

@Controller()
export class EmailsController {
  constructor ( private readonly emailsService: EmailsService ) { }

  @Post( 'admin/emails/send' )
  async sendMail () {
    const info = await this.emailsService.sendMail(
      "admin@test.com",
      "test@test.com",
      "An email to test the service"
    );

    console.log( "TEST URL IS: ", getTestMessageUrl( info ) );
    return info;
  }

  @Post()
  create ( @Body() createEmailDto: CreateEmailDto ) {
    return this.emailsService.create( createEmailDto );
  }

  @Get()
  findAll () {
    return this.emailsService.findAll();
  }

  @Get( ':id' )
  findOne ( @Param( 'id' ) id: string ) {
    return this.emailsService.findOne( +id );
  }

  @Patch( ':id' )
  update ( @Param( 'id' ) id: string, @Body() updateEmailDto: UpdateEmailDto ) {
    return this.emailsService.update( +id, updateEmailDto );
  }

  @Delete( ':id' )
  remove ( @Param( 'id' ) id: string ) {
    return this.emailsService.remove( +id );
  }
}
