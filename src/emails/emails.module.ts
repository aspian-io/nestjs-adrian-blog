import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { PostsModule } from 'src/posts/posts.module';

@Module( {
  imports: [ PostsModule ],
  controllers: [ EmailsController ],
  providers: [ EmailsService ]
} )
export class EmailsModule { }
