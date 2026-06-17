import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PostLike } from '../entities/post-like.entity';
import { Post } from '../entities/post.entity';

@Injectable()
export class PostLikesService {
  constructor(
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,

    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async likePost(postId: string, userId: number): Promise<PostLike> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.postLikeRepository.findOne({
      where: {
        post_id: postId,
        user_id: userId,
      },
    });

    if (existing) {
      throw new ConflictException('Post already liked');
    }

    const like = this.postLikeRepository.create({
      post_id: postId,
      user_id: userId,
    });

    const saved = await this.postLikeRepository.save(like);

    await this.postRepository.increment({ id: postId }, 'likes_count', 1);

    return saved;
  }

  async unlikePost(postId: string, userId: number): Promise<void> {
    const like = await this.postLikeRepository.findOne({
      where: {
        post_id: postId,
        user_id: userId,
      },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    await this.postLikeRepository.remove(like);

    await this.postRepository.decrement({ id: postId }, 'likes_count', 1);
  }

  async hasUserLiked(postId: string, userId: number): Promise<boolean> {
    const like = await this.postLikeRepository.findOne({
      where: {
        post_id: postId,
        user_id: userId,
      },
    });

    return !!like; // Convert to boolean
  }

  async getPostLikesCount(postId: string): Promise<number> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.postLikeRepository.count({
      where: { post_id: postId },
    });
  }
}
