import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SoftDeletableEntity } from '../../common/entities/base.entity';
import { Scholarship } from './scholarship.entity';
import { User } from '../../user/entities/user.entity';

export enum ApplicationStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('scholarship_applications')
export class ScholarshipApplication extends SoftDeletableEntity {
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  @Column({ name: 'applied_at', type: 'timestamp', nullable: true })
  appliedAt: Date | null;

  @ManyToOne(() => User, (user) => user.applications, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Scholarship, (scholarship) => scholarship.applications, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'scholarship_id' })
  scholarship: Scholarship;
}
