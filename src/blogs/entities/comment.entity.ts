import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { Post } from './post.entity';
import { CommentStatus } from '../enums/blog.enums';

@Index(['post', 'status', 'created_at'])
@Index(['parent'])
@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ✅ Explicit FK column
  @Column({ type: 'uuid', nullable: true })
  parent_id: string | null;

  // Owning side of self-reference
  @ManyToOne(() => Comment, (c) => c.replies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment;

  // Inverse side
  @OneToMany(() => Comment, (c) => c.parent)
  replies: Comment[];

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: CommentStatus,
  })
  status: CommentStatus;

  @Column({ default: 0 })
  likes_count: number;

  @Column({ default: 0 })
  dislikes_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
