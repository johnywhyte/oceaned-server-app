import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Application } from './applications.entity';

export enum InvoiceStatus {
  UNPAID = 'unpaid',
  AWAITING_CONFIRMATION = 'awaiting_confirmation',
  PAID = 'paid',
}

@Entity('invoices')
@Index('idx_invoices_application', ['applicationId'])
export class Invoice {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'application_id', type: 'bigint' })
  applicationId: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'reference', type: 'varchar', length: 40, unique: true })
  reference: string;

  @Column({ type: 'varchar', length: 200 })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.UNPAID,
  })
  status: InvoiceStatus;

  @Column({ name: 'payment_proof_url', type: 'varchar', length: 500, nullable: true })
  paymentProofUrl: string | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Application, (application) => application.invoices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'application_id' })
  application: Application;
}
