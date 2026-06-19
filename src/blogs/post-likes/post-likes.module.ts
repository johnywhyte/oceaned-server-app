import { Module } from '@nestjs/common';
import { PostLikesService } from './post-likes.service';
import { PostLikesController } from './post-likes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostLike } from '../entities/post-like.entity';
import { Post } from '../entities/post.entity';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [PostsModule, TypeOrmModule.forFeature([PostLike, Post])],
  controllers: [PostLikesController],
  providers: [PostLikesService],
})
export class PostLikesModule {}
