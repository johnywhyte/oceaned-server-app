import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';

import { Comment } from './comment.entity';
import { User } from '../../user/entities/user.entity';
import { ReportStatus } from '../enums/blog.enums';

@Entity('comment_reports')
export class CommentReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  comment_id: string;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @ManyToOne(() => User)
  reported_by: User;

  @ManyToOne(() => User, { nullable: true })
  reviewed_by: User;

  @Column('text')
  reason: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
