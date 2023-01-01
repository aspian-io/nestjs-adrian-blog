import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { PostsModule } from 'src/posts/posts.module';
import { FilesModule } from 'src/files/files.module';
import { Email } from './entities/email.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module( {
  imports: [ TypeOrmModule.forFeature( [ Email ] ), PostsModule, FilesModule ],
  controllers: [ EmailsController ],
  providers: [ EmailsService ]
} )
export class EmailsModule { }
