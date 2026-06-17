import { Entity, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Scholarship } from './scholarship.entity';
import { User } from '../../user/entities/user.entity';

@Entity('saved_scholarships')
@Unique('unique_save', ['user', 'scholarship'])
export class SavedScholarship extends BaseEntity {
  @ManyToOne(() => User, (user) => user.savedScholarships, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Scholarship, (scholarship) => scholarship.savedByUsers, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'scholarship_id' })
  scholarship: Scholarship;
}
