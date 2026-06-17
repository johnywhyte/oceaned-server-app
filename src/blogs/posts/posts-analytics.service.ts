import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

import { PostViewEvent } from './../entities/post-view-event.entity';
import { PostPopularityStat } from './../entities/post-popularity-stat.entity';

@Injectable()
export class PostsAnalyticsService {
  constructor(
    @InjectRepository(PostViewEvent)
    private viewRepository: Repository<PostViewEvent>,

    @InjectRepository(PostPopularityStat)
    private popularityRepository: Repository<PostPopularityStat>,
  ) {}

  async trackView(postId: string, userId?: number) {
    const view = this.viewRepository.create({
      post: { id: postId },
      user: userId ? { id: userId } : undefined,
    });

    await this.viewRepository.save(view);
  }

  async getViewStats(postId: string) {
    const totalViews = await this.viewRepository.count({
      where: { post: { id: postId } },
    });

    const last7Days = await this.viewRepository.count({
      where: {
        post: { id: postId },
        viewed_at: Between(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          new Date(),
        ),
      },
    });

    return {
      totalViews,
      last7Days,
    };
  }

  async getPopularity(postId: string) {
    const stat = await this.popularityRepository.findOne({
      where: { post: { id: postId } },
    });

    if (!stat) {
      return {
        score: 0,
        views: 0,
        likes: 0,
        comments: 0,
      };
    }

    return stat;
  }
}
