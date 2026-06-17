import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import * as crypto from 'crypto';

import { User } from '../../user/entities/user.entity';
import { Category } from '../../blogs/entities/category.entity';
import { Tag } from '../../blogs/entities/tag.entity';
import { Post } from '../../blogs/entities/post.entity';
import { PostCategory } from '../../blogs/entities/post-category.entity';
import { PostTag } from '../../blogs/entities/post-tag.entity';
import { Comment } from '../../blogs/entities/comment.entity';
import { PostLike } from '../../blogs/entities/post-like.entity';
import { SavedPost } from '../../blogs/entities/saved-post.entity';
import { CommentReaction } from '../../blogs/entities/comment-reaction.entity';
import { CommentReport } from '../../blogs/entities/comment-report.entity';
import {
  PostStatus,
  CommentStatus,
} from '../../blogs/enums/blog.enums';

export class BlogSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const userRepo = dataSource.getRepository(User);
    const categoryRepo = dataSource.getRepository(Category);
    const tagRepo = dataSource.getRepository(Tag);
    const postRepo = dataSource.getRepository(Post);
    const postCategoryRepo = dataSource.getRepository(PostCategory);
    const postTagRepo = dataSource.getRepository(PostTag);
    const commentRepo = dataSource.getRepository(Comment);
    const postLikeRepo = dataSource.getRepository(PostLike);
    const savedPostRepo = dataSource.getRepository(SavedPost);
    const commentReactionRepo = dataSource.getRepository(CommentReaction);
    const commentReportRepo = dataSource.getRepository(CommentReport);

    // 0. Ensure Role 1 exists (Back to Number)
    await dataSource.query(
      `INSERT IGNORE INTO roles (id, name, description) VALUES (1, 'ADMIN', 'Administrator Role')`
    );

    // 1. Get or Create Author
    let user = await userRepo.findOne({ where: {} });
    if (!user) {
      user = userRepo.create({
        email: `author_${crypto.randomBytes(4).toString('hex')}@example.com`,
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 1, // Reverted to number
        isActive: true,
      });
      user = await userRepo.save(user);
    }

    // 1b. Get or Create Reader
    let user2 = await userRepo.findOne({ where: { email: 'reader@example.com' } });
    if (!user2) {
      user2 = userRepo.create({
        email: 'reader@example.com',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith',
        roleId: 1, // Reverted to number
        isActive: true,
      });
      user2 = await userRepo.save(user2);
    }

    // 2. Clear existing data
    console.log('Clearing existing blog data...');
    const repos = [commentReportRepo, commentReactionRepo, postLikeRepo, savedPostRepo, postTagRepo, postCategoryRepo, commentRepo, tagRepo, postRepo, categoryRepo];
    for (const repo of repos) {
        await repo.createQueryBuilder().delete().execute();
    }

    console.log('Seeding Categories...');
    const categories = await categoryRepo.save([
      categoryRepo.create({ name: 'Technology', slug: 'technology', description: 'All about tech', created_by: user.id }),
      categoryRepo.create({ name: 'Lifestyle', slug: 'lifestyle', description: 'Everyday life', created_by: user.id }),
    ]);

    console.log('Seeding Tags...');
    const tags = await tagRepo.save([
      tagRepo.create({ name: 'JavaScript', slug: 'javascript' }),
      tagRepo.create({ name: 'NestJS', slug: 'nestjs' }),
    ]);

    console.log('Seeding Posts...');
    const posts = await postRepo.save([
      postRepo.create({
        title: 'Getting started with NestJS',
        slug: 'getting-started-with-nestjs',
        content: 'NestJS is a fantastic framework...',
        author_id: user.id,
        status: PostStatus.PUBLISHED,
        published_at: new Date(),
        is_featured: true,
      }),
      postRepo.create({
        title: 'Healthy Living',
        slug: 'healthy-living',
        content: 'Drink water...',
        author_id: user.id,
        status: PostStatus.PUBLISHED,
        published_at: new Date(),
      }),
    ]);

    console.log('Seeding Post Categories and Tags...');
    await postCategoryRepo.save([
      postCategoryRepo.create({ post_id: posts[0].id, category_id: categories[0].id }),
      postCategoryRepo.create({ post_id: posts[1].id, category_id: categories[1].id }),
    ]);

    await postTagRepo.save([
      postTagRepo.create({ post_id: posts[0].id, tag_id: tags[0].id }),
      postTagRepo.create({ post_id: posts[0].id, tag_id: tags[1].id }),
    ]);

    console.log('Seeding Comments...');
    await commentRepo.save(commentRepo.create({
      post: posts[0],
      user: user2,
      content: 'Great article!',
      status: CommentStatus.APPROVED,
    }));

    console.log('Seeding Interactions...');
    await postLikeRepo.save([
      postLikeRepo.create({ post_id: posts[0].id, user_id: user2.id }),
    ]);

    await savedPostRepo.save([
      savedPostRepo.create({ post_id: posts[0].id, user: user2 }),
    ]);

    console.log('✅ Blog module data seeded successfully!');
  }
}