import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Application } from './applications.entity';

export enum UserApplicationRole {
  STUDENT = 'student',
  AGENT = 'agent',
}

@Entity('user_applications')
@Index('idx_user_applications_user', ['userId'])
@Index('idx_user_applications_application', ['applicationId'])
@Index('idx_user_applications_composite', ['userId', 'applicationId'], {
  unique: true,
})
export class UserApplication {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'application_id', type: 'bigint' })
  applicationId: number;

  @Column({
    type: 'enum',
    enum: UserApplicationRole,
    default: UserApplicationRole.STUDENT,
  })
  role: UserApplicationRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.userApplications)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Application, (application) => application.userApplications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'application_id' })
  application: Application;
}