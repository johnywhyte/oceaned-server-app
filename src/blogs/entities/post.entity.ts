import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  Index,
  BeforeUpdate,
  BeforeInsert,
  DeleteDateColumn,
} from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { Category } from './category.entity';
import { Tag } from './tag.entity';
import { PostStatus } from '../enums/blog.enums';
import { PostCategory } from './post-category.entity';
import { PostTag } from './post-tag.entity';
import { Comment } from './comment.entity';

@Index(['status', 'published_at'])
@Index(['author_id'])
@Index(['is_featured'])
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  featured_image_url: string;

  @Column('text')
  content: string;

  @Column()
  author_id: number;

  @ManyToOne(() => User, { eager: false, nullable: false })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ nullable: true, type: 'int', unsigned: true })
  read_time_minutes: number;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status: PostStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  published_at: Date;

  @Column({ nullable: true, length: 255 })
  seo_meta_title: string;

  @Column({ nullable: true, length: 500 })
  seo_meta_description: string;

  @Column({ type: 'int', default: 0, unsigned: true })
  views_count: number;

  @Column({ type: 'int', default: 0 })
  likes_count: number;

  @Column({ type: 'int', default: 0 })
  comments_count: number;

  @Column({ default: false })
  is_featured: boolean;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => PostTag, (pt) => pt.post)
  postTags: PostTag[];

  @OneToMany(() => PostCategory, (pc) => pc.post)
  postCategories: PostCategory[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date;

  @BeforeInsert()
  @BeforeUpdate()
  calculateReadTime() {
    if (!this.content) return;

    const words = this.content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);

    this.read_time_minutes = minutes;
  }

  @BeforeInsert()
  @BeforeUpdate()
  normalizeSlug() {
    if (this.slug) {
      this.slug = this.slug
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');
    }
  }
}
