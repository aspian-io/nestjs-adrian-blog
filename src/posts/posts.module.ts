import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { BullModule } from '@nestjs/bull';
import { PostQueues } from './queues/queues.enum';
import { ScheduledPostJobConsumer } from './queues/consumers/scheduled-post.consumer';
import { PostSlugsHistory } from './entities/post-slug.entity';

@Module( {
  imports: [
    TypeOrmModule.forFeature( [ Post, PostSlugsHistory ] ),
    BullModule.registerQueue( { name: PostQueues.SCHEDULED_POSTS } ),
  ],
  controllers: [ PostsController ],
  providers: [ PostsService, ScheduledPostJobConsumer ],
  exports: [ PostsService, TypeOrmModule ]
} )
export class PostsModule { }
