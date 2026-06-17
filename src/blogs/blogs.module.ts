import { Module } from '@nestjs/common';
import { CommentsModule } from './comments/comments.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { PostsModule } from './posts/posts.module';
import { PostLikesModule } from './post-likes/post-likes.module';
import { SavedPostsModule } from './saved-posts/saved-posts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostCategory } from './entities/post-category.entity';
import { PostTag } from './entities/post-tag.entity';

@Module({
  imports: [
    CommentsModule,
    CategoriesModule,
    TagsModule,
    PostsModule,
    PostLikesModule,
    SavedPostsModule,
    TypeOrmModule.forFeature([PostTag, PostCategory]),
  ],
})
export class BlogsModule {}
