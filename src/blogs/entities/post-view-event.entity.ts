import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
  Column,
} from 'typeorm';

import { Post } from './post.entity';
import { User } from '../../user/entities/user.entity';

@Index(['post', 'viewed_at'])
@Entity('post_views_events')
export class PostViewEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  post_id: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @CreateDateColumn({ type: 'timestamp' })
  viewed_at: Date;
}
