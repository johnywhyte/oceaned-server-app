import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';

import { Post } from './post.entity';
import { PopularityPeriod } from '../enums/blog.enums';

@Entity('post_popularity_stats')
export class PostPopularityStat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  post: Post;

  @Column({
    type: 'enum',
    enum: PopularityPeriod,
  })
  period: PopularityPeriod;

  @Column({ type: 'date' })
  period_start: Date;

  @Column({ type: 'int', default: 0 })
  views_count: number;

  @Column({ type: 'int', default: 0 })
  likes_count: number;

  @Column({ type: 'int', default: 0 })
  comments_count: number;

  @Column({ type: 'timestamp' })
  calculated_at: Date;
}
