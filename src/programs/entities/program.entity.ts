import { Entity, Column, ManyToOne, JoinColumn, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { School } from '../../schools/entities/school.entity';
import { DegreeType } from '../../scholarship/entities/degree-type.entity';
import { Scholarship } from '../../scholarship/entities/scholarship.entity';
import { CurrencyCode } from '../../scholarship/entities/enums/scholarship.enums';
import { OneToMany } from 'typeorm';
import { Application } from '../../applications/entities/applications.entity';

@Entity('programs')
export class Program extends BaseEntity {
  @Column({
    name: 'course_name',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  courseName: string;

  @OneToMany(() => Application, (application) => application.program)
  applications: Application[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  duration: string | null;

  @Column({
    name: 'intake_periods',
    type: 'json',
    nullable: true,
    comment: 'Array of intake periods e.g ["September", "January"]',
  })
  intakePeriods: string[] | null;

  @Column({ name: 'application_deadline', type: 'timestamp', nullable: true })

  
  applicationDeadline: Date | null;

  @Column({
    name: 'language_requirements',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  languageRequirements: string | null;

  @Column({
    name: 'tuition_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  tuitionFee: number | null;

  @Column({
    type: 'char',
    length: 3,
    nullable: true,
    comment: 'ISO 4217 currency code e.g USD, GBP',
  })
  currency: CurrencyCode | null;

  @Column({
    name: 'payment_plan_options',
    type: 'json',
    nullable: true,
    comment: 'Array of payment plan options',
  })
  paymentPlanOptions: string[] | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => School, (school) => school.programs, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToOne(() => DegreeType, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'degree_type_id' })
  degreeType: DegreeType;

  @ManyToMany(() => Scholarship, (scholarship) => scholarship.programs)
  scholarships: Scholarship[];
}
