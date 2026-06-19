import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { PostsAnalyticsService } from './posts-analytics.service';
import { PostPopularityStat } from '../entities/post-popularity-stat.entity';
import { PostViewEvent } from '../entities/post-view-event.entity';
import { PostCategory } from '../entities/post-category.entity';
import { PostTag } from '../entities/post-tag.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostViewEvent,
      PostPopularityStat,
      PostCategory,
      PostTag,
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsAnalyticsService],
  exports: [TypeOrmModule],
})
export class PostsModule {}
