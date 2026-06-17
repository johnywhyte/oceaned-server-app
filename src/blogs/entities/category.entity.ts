import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToMany,
  BeforeUpdate,
  BeforeInsert,
} from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { PostCategory } from './post-category.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  seo_meta_title: string;

  @Column({ nullable: true })
  seo_meta_description: string;

  @Column({ default: true })
  is_enabled: boolean;

  /* FK COLUMN */
  @Column()
  created_by: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => PostCategory, (pc) => pc.category)
  postCategories: PostCategory[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeSlug() {
    const base = this.slug || this.name;

    this.slug = base
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
  }
}
