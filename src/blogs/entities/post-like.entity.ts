import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
  JoinColumn,
  Column,
} from 'typeorm';

import { Post } from './post.entity';
import { User } from '../../user/entities/user.entity';

@Entity('post_likes')
@Unique(['post', 'user'])
export class PostLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  post_id: string;

  @Column()
  user_id: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
