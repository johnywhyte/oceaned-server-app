import { Post } from 'src/blogs/entities/post.entity';
export interface AllPostsResponse {
  data: Post[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}
