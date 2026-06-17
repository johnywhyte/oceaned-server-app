import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Scholarship } from '../../scholarship/entities/scholarship.entity';
import { Program } from '../../programs/entities/program.entity';
import { UserApplication } from './user-application.entity';
 
export enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  SHORTLISTED = 'shortlisted',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}
 
@Entity('applications')
@Index('idx_applications_user', ['userId'])
@Index('idx_applications_scholarship', ['scholarshipId'])
@Index('idx_applications_status', ['status'])
@Index('idx_applications_submitted', ['submittedAt'])
export class Application {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;
 
  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;
 
  @Column({ name: 'scholarship_id', type: 'bigint', nullable: true })
  scholarshipId: number | null;

  @Column({ name: 'program_id', type: 'bigint' })
  programId: number;
 
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;
 
  @Column({ name: 'personal_statement', type: 'text', nullable: true })
  personalStatement: string | null;
 
  @Column({ name: 'current_gpa', type: 'decimal', precision: 3, scale: 2, nullable: true })
  currentGpa: number | null;
 
  @Column({ name: 'intended_major', type: 'varchar', length: 200, nullable: true })
  intendedMajor: string | null;
 
  @Column({ type: 'json', nullable: true })
  documents: {
    name: string;
    type: string;
    url: string;
    uploadedAt: Date;
  }[] | null;
 
  @Column({ type: 'json', nullable: true })
  references: {
    name: string;
    email: string;
    institution: string;
    relationship: string;
  }[] | null;
 
  @Column({ name: 'additional_answers', type: 'json', nullable: true })
  additionalAnswers: Record<string, string> | null;
 
  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;
 
  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;
 
  @Column({ name: 'decision_at', type: 'timestamp', nullable: true })
  decisionAt: Date | null;
 
  @Column({ name: 'reviewer_notes', type: 'text', nullable: true })
  reviewerNotes: string | null;
 
  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;
 
  @Column({ name: 'is_complete', type: 'tinyint', width: 1, default: 0 })
  isComplete: boolean;
 
  @Column({ name: 'completion_percentage', type: 'int', default: 0 })
  completionPercentage: number;
 
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
 
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
 
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
 
  @ManyToOne(() => User, (user) => user.applications)
  @JoinColumn({ name: 'user_id' })
  user: User;
 
  @ManyToOne(() => Scholarship, (scholarship) => scholarship.applications, {
    nullable: true,
  })
  @JoinColumn({ name: 'scholarship_id' })
  scholarship: Scholarship | null;
 
  @ManyToOne(() => Program, (program) => program.applications)
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @OneToMany(() => UserApplication, (ua) => ua.user)
userApplications: UserApplication[];
}
 