import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { BlogsModule } from './src/blogs/blogs.module';
import { UsersModule } from './src/user/user.module';

import { PostsService } from './src/blogs/posts/posts.service';
import { CategoriesService } from './src/blogs/categories/categories.service';
import { TagsService } from './src/blogs/tags/tags.service';

import { Post } from './src/blogs/entities/post.entity';
import { Category } from './src/blogs/entities/category.entity';
import { Tag } from './src/blogs/entities/tag.entity';
import { Comment } from './src/blogs/entities/comment.entity';
import { PostCategory } from './src/blogs/entities/post-category.entity';
import { PostTag } from './src/blogs/entities/post-tag.entity';
import { PostLike } from './src/blogs/entities/post-like.entity';
import { SavedPost } from './src/blogs/entities/saved-post.entity';
import { CommentReaction } from './src/blogs/entities/comment-reaction.entity';
import { CommentReport } from './src/blogs/entities/comment-report.entity';
import { User } from './src/user/entities/user.entity';
import { Role } from './src/user/entities/role.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([
      Post,
      Category,
      Tag,
      Comment,
      PostCategory,
      PostTag,
      PostLike,
      SavedPost,
      CommentReaction,
      CommentReport,
      User,
      Role,
    ]),
    UsersModule,
  ],
  providers: [PostsService, CategoriesService, TagsService],
})
class TestModule {}

/**
 * Standalone script to easily test out the blog services directly against the database.
 * Run this with: npx ts-node -r tsconfig-paths/register test-blog-services.ts
 */
async function bootstrap() {
  console.log('Bootstrapping NestJS application context...');
  let app;
  try {
    app = await NestFactory.createApplicationContext(TestModule, {
      logger: ['error', 'warn'],
    });

    const postsService = app.get(PostsService);
    const categoriesService = app.get(CategoriesService);
    const tagsService = app.get(TagsService);

    console.log('\n================================');
    console.log('      TESTING CATEGORIES        ');
    console.log('================================');
    const categories = await categoriesService.findAll();
    console.log(`Found ${categories.length} categories:`);
    categories.forEach((c) => console.log(` - ${c.name} (${c.slug})`));

    console.log('\n================================');
    console.log('         TESTING TAGS           ');
    console.log('================================');
    const tags = await tagsService.findAll();
    console.log(`Found ${tags.length} tags:`);
    tags.forEach((t) => console.log(` - ${t.name} (${t.slug})`));

    console.log('\n================================');
    console.log('         TESTING POSTS          ');
    console.log('================================');
    // Using default pagination and sorting
    const postsResponse = await postsService.findAllPosts({ limit: 5 });
    console.log(`Total Posts in DB: ${postsResponse.meta.total}`);

    if (postsResponse.data.length > 0) {
      console.log('Listing Recent Posts:');
      postsResponse.data.forEach((p) => {
        const catNames =
          p.postCategories?.map((pc) => pc.category.name).join(', ') || 'None';
        const tagNames =
          p.postTags?.map((pt) => pt.tag.name).join(', ') || 'None';
        console.log(` - [${p.status}] ${p.title} (By: ${p.author.firstName})`);
        console.log(`   Categories: ${catNames}`);
        console.log(`   Tags: ${tagNames}`);
      });

      const firstPost = postsResponse.data[0];
      console.log(`\nFetching Related Posts for "${firstPost.title}"...`);
      const relatedPosts = await postsService.getRelatedPosts(firstPost.id);

      if (relatedPosts.length > 0) {
        relatedPosts.forEach((rp) => console.log(` - ${rp.title}`));
      } else {
        console.log(
          ' No related posts found (based on tags/categories match).',
        );
      }

      console.log(`\nFetching Post By Slug "${firstPost.slug}"...`);
      const postBySlug = await postsService.findOneBySlug(firstPost.slug);
      console.log(` Successfully retrieved! Title: "${postBySlug.title}"`);
    }
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    if (app) {
      console.log('\nClosing application context...');
      await app.close();
    }
  }
}

bootstrap();
