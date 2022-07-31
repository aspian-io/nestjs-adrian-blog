import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import * as Handlebars from 'handlebars';

const temp = `
<p>You are receiving this because you (or someone else) has changed the password of your '{{email}}' user account.</p>

<p>If this was you, you can safely ignore this email.</p>

<p>If not, please reach out to us at {{link}}</p>

<p>Thanks,</p>

<p>The {{brand}} team.</p>
`;

@Injectable()
export class EmailsService {
  constructor ( private readonly mailerService: MailerService ) { }



  sendMail ( from: string, to: string, subject: string, template?: string, cc?: string, bcc?: string ) {
    const compiled = Handlebars.compile( temp );
    const html = compiled( {
      email: 'admin@test.com',
      link: 'http://this_link_is_for_test',
      brand: 'ADRIAN'
    } );

    return this.mailerService.sendMail( {
      from,
      to,
      subject,
      html
    } );
  }
  create ( createEmailDto: CreateEmailDto ) {
    return 'This action adds a new email';
  }

  findAll () {
    return `This action returns all emails`;
  }

  findOne ( id: number ) {
    return `This action returns a #${ id } email`;
  }

  update ( id: number, updateEmailDto: UpdateEmailDto ) {
    return `This action updates a #${ id } email`;
  }

  remove ( id: number ) {
    return `This action removes a #${ id } email`;
  }
}
