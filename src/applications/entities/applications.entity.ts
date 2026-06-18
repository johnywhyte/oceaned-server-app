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
import { School } from '../../schools/entities/school.entity';
import { UserApplication } from './user-application.entity';
import { Invoice } from './invoice.entity';
 
export enum ApplicationStatus {
  // In-progress before submission.
  DRAFT = 'draft',
  // OCEANED study-abroad application lifecycle.
  PENDING_PAYMENT = 'pending_payment',
  AWAITING_CONFIRMATION = 'awaiting_confirmation',
  PROCESSING = 'processing',
  AWAITING_ADMISSION = 'awaiting_admission',
  ADMISSION_GRANTED = 'admission_granted',
  ADMISSION_REJECTED = 'admission_rejected',
  WITHDRAWN = 'withdrawn',
  // Legacy scholarship-flow statuses (kept for backward compatibility).
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  SHORTLISTED = 'shortlisted',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum ProofOfFundsOption {
  BLOCKED_ACCOUNT = 'blocked_account',
  SPONSORSHIP = 'sponsorship',
}

export enum UniversityType {
  PUBLIC = 'public',
  PRIVATE = 'private',
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

  @Column({ name: 'program_id', type: 'bigint', nullable: true })
  programId: number | null;

  @Column({ name: 'school_id', type: 'bigint', nullable: true })
  schoolId: number | null;

  @Column({ name: 'intended_course', type: 'varchar', length: 200, nullable: true })
  intendedCourse: string | null;

  @Column({ name: 'intake', type: 'varchar', length: 100, nullable: true })
  intake: string | null;

  @Column({ name: 'degree_type', type: 'varchar', length: 100, nullable: true })
  degreeType: string | null;

  @Column({
    name: 'university_type',
    type: 'enum',
    enum: UniversityType,
    nullable: true,
  })
  universityType: UniversityType | null;

  @Column({
    name: 'proof_of_funds_option',
    type: 'enum',
    enum: ProofOfFundsOption,
    nullable: true,
  })
  proofOfFundsOption: ProofOfFundsOption | null;

  @Column({ name: 'payment_proof_url', type: 'varchar', length: 500, nullable: true })
  paymentProofUrl: string | null;

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
 
  @ManyToOne(() => Program, (program) => program.applications, { nullable: true })
  @JoinColumn({ name: 'program_id' })
  program: Program | null;

  @ManyToOne(() => School, { nullable: true, eager: true })
  @JoinColumn({ name: 'school_id' })
  school: School | null;

  @OneToMany(() => Invoice, (invoice) => invoice.application)
  invoices: Invoice[];

  @OneToMany(() => UserApplication, (ua) => ua.user)
  userApplications: UserApplication[];
}
 