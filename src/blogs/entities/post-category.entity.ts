import { Entity, ManyToOne, JoinColumn, PrimaryColumn, Index } from 'typeorm';
import { Post } from './post.entity';
import { Category } from './category.entity';

@Entity('post_categories')
@Index(['category_id'])
export class PostCategory {
  @PrimaryColumn('uuid')
  post_id: string;

  @PrimaryColumn('uuid')
  category_id: string;

  @ManyToOne(() => Post, (post) => post.postCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => Category, (category) => category.postCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
