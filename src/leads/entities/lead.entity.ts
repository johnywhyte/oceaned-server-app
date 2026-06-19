import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name', type: 'varchar', length: 200 })
  fullName: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'destination_country', type: 'varchar', length: 100, nullable: true })
  destinationCountry: string | null;

  @Column({ name: 'preferred_course', type: 'varchar', length: 200, nullable: true })
  preferredCourse: string | null;

  @Column({ name: 'start_period', type: 'varchar', length: 50, nullable: true })
  startPeriod: string | null;

  @Column({ name: 'budget_range', type: 'varchar', length: 50, nullable: true })
  budgetRange: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
