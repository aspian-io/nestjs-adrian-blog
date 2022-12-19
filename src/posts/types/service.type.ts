import { JobId } from "bull";
import { Post, PostTypeEnum } from "../entities/post.entity";

// Find By Slug Return Type
export interface IPostReturnFindBySlug {
  post: Post;
  redirect?: {
    status: number;
  };
}

export enum PostErrorsEnum {
  DUPLICATE_POST = 'Duplicate Post',
  DUPLICATE_SLUG = 'Duplicate Slug',
}

export enum PostErrorsInternalCodeEnum {
  DUPLICATE_POST = 4001,
  DUPLICATE_SLUG = 4002,
}

export interface PostsDelayedJobs {
  jobId: JobId;
  title: string;
  slug: string;
  type: PostTypeEnum;
  scheduledToPublish: Date;
  scheduledToArchive: Date;
}