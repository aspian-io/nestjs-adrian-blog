import { Process, Processor } from "@nestjs/bull";
import { InjectRepository } from "@nestjs/typeorm";
import { Job } from "bull";
import { Post, PostStatusEnum, PostTypeEnum } from "src/posts/entities/post.entity";
import { Repository } from "typeorm";
import { PostJobs } from "../jobs.enum";
import { PostQueues } from "../queues.enum";

export interface IScheduledPostPayload {
  id: string;
  title: string;
  slug: string;
  type: PostTypeEnum;
  scheduledToPublish: Date;
  scheduledToArchive: Date;
}

@Processor( PostQueues.SCHEDULED_POSTS )
export class ScheduledPostJobConsumer {
  constructor ( @InjectRepository( Post ) private readonly postRepository: Repository<Post> ) { }

  @Process( PostJobs.SCHEDULED_POST_TO_PUBLISH )
  async publishPost ( job: Job<IScheduledPostPayload> ) {
    try {
      const post = await this.postRepository.findOne( { where: { id: job.data.id } } );
      post.status = PostStatusEnum.PUBLISH;
      await this.postRepository.save( post );
      console.log( `The scheduled post with the post id: '${ post.id }', has been published successfully` );
    } catch ( error ) {
      console.log( "Something went wrong publishing the scheduled post", error );
    }
  }

  @Process( PostJobs.SCHEDULED_POST_TO_ARCHIVE )
  async archivePost ( job: Job<IScheduledPostPayload> ) {
    try {
      const post = await this.postRepository.findOne( { where: { id: job.data.id } } );
      post.status = PostStatusEnum.ARCHIVE;
      await this.postRepository.save( post );
      console.log( `The scheduled post with the post id: '${ post.id }', has been archived successfully` );
    } catch ( error ) {
      console.log( "Something went wrong archiving the scheduled post", error );
    }
  }
}