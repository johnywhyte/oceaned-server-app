import { Module } from '@nestjs/common';
import { SavedPostsService } from './saved-posts.service';
import { SavedPostsController } from './saved-posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedPost } from '../entities/saved-post.entity';
import { Post } from '../entities/post.entity';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [PostsModule, TypeOrmModule.forFeature([SavedPost, Post])],
  controllers: [SavedPostsController],
  providers: [SavedPostsService],
})
export class SavedPostsModule {}
