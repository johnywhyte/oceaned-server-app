import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../entities/comment.entity';
import { Post } from '../entities/post.entity';
import { PostsModule } from '../posts/posts.module';
import { CommentReactionService } from './comment-reaction.service';
import { CommentReportService } from './comment-report.service';
import { CommentReaction } from '../entities/comment-reaction.entity';
import { CommentReport } from '../entities/comment-report.entity';

@Module({
  imports: [
    PostsModule,
    TypeOrmModule.forFeature([Comment, Post, CommentReaction, CommentReport]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService, CommentReactionService, CommentReportService],
})
export class CommentsModule {}
