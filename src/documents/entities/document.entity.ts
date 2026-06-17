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
import { UserDocument } from '../../documents/entities/user-document.entity';

export enum DocumentType {
  PASSPORT = 'passport',
  ACADEMIC_TRANSCRIPT = 'academic_transcript',
  CV = 'cv',
  STATEMENT_OF_PURPOSE = 'statement_of_purpose',
  RECOMMENDATION_LETTER = 'recommendation_letter',
  BIRTH_CERTIFICATE = 'birth_certificate',
  LANGUAGE_CERTIFICATE = 'language_certificate',
  FINANCIAL_STATEMENT = 'financial_statement',
  OTHER = 'other',
}

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('documents')
@Index('idx_documents_user', ['userId'])
@Index('idx_documents_type', ['documentType'])
@Index('idx_documents_status', ['status'])
export class Document {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({
    name: 'document_type',
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @Column({ name: 'custom_label', type: 'varchar', length: 100, nullable: true })
  customLabel: string | null;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string;

  @Column({ name: 'file_url', type: 'varchar', length: 500 })
  fileUrl: string;

  @Column({ name: 'file_key', type: 'varchar', length: 500, nullable: true })
  fileKey: string | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({ name: 'admin_remarks', type: 'text', nullable: true })
  adminRemarks: string | null;

  @Column({ name: 'reviewed_by', type: 'bigint', nullable: true })
  reviewedBy: number | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'is_verified', type: 'tinyint', width: 1, default: 0 })
  isVerified: boolean;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => User, (user) => user.documents)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => UserDocument, (ud) => ud.document)
  userDocuments: UserDocument[];
}