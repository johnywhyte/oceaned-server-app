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
import { Document } from './document.entity';

export enum UserDocumentAccess {
  OWNER = 'owner',
  VIEWER = 'viewer',
}

@Entity('user_documents')
@Index('idx_user_documents_user', ['userId'])
@Index('idx_user_documents_document', ['documentId'])
@Index('idx_user_documents_composite', ['userId', 'documentId'], { unique: true })
export class UserDocument {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'document_id', type: 'bigint' })
  documentId: number;

  @Column({
    type: 'enum',
    enum: UserDocumentAccess,
    default: UserDocumentAccess.OWNER,
  })
  access: UserDocumentAccess;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.userDocuments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Document, (document) => document.userDocuments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'document_id' })
  document: Document;
}