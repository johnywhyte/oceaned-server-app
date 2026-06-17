import { Entity, ManyToOne, JoinColumn, PrimaryColumn, Index } from 'typeorm';
import { Post } from './post.entity';
import { Tag } from './tag.entity';

@Entity('post_tags')
@Index(['tag_id'])
export class PostTag {
  @PrimaryColumn('uuid')
  post_id: string;

  @PrimaryColumn('uuid')
  tag_id: string;

  @ManyToOne(() => Post, (post) => post.postTags, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => Tag, (tag) => tag.postTags, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
