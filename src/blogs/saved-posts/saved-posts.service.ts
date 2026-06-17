import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SavedPost } from '../entities/saved-post.entity';
import { Post } from '../entities/post.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class SavedPostsService {
  constructor(
    @InjectRepository(SavedPost)
    private readonly savedPostRepository: Repository<SavedPost>,

    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async savePost(postId: string, userId: number): Promise<SavedPost> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.savedPostRepository.findOne({
      where: {
        post_id: postId,
        user: { id: userId },
      },
    });

    if (existing) {
      throw new ConflictException('Post already saved');
    }

    const savedPost = this.savedPostRepository.create({
      post_id: postId,
      user: { id: userId } as unknown as User,
    });

    return this.savedPostRepository.save(savedPost);
  }

  async removeSavedPost(postId: string, userId: number): Promise<void> {
    const saved = await this.savedPostRepository.findOne({
      where: {
        post_id: postId,
        user: { id: userId },
      },
    });

    if (!saved) {
      throw new NotFoundException('Saved post not found');
    }

    await this.savedPostRepository.remove(saved);
  }

  async getUserSavedPosts(userId: number): Promise<SavedPost[]> {
    return this.savedPostRepository.find({
      where: {
        user: { id: userId },
      },
      relations: ['post'],
      order: {
        created_at: 'DESC',
      },
    });
  }
}
