import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Unique,
  JoinColumn,
} from 'typeorm';

import { Comment } from './comment.entity';
import { User } from '../../user/entities/user.entity';
import { ReactionType } from '../enums/blog.enums';

@Entity('comment_reactions')
@Unique(['comment', 'user'])
export class CommentReaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  comment_id: string;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ReactionType,
  })
  reaction: ReactionType;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
