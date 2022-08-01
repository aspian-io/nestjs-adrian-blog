import { Post } from "../entities/post.entity";

// Find By Slug Return Type
export interface IPostReturnFindBySlug {
  post: Post;
  redirect?: {
    status: number;
  };
}