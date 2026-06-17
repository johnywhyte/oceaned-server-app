import {
  Entity,
  Column,
  Index,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { SoftDeletableEntity } from '../../common/entities/base.entity';
import {
  ScholarshipStatus,
  FundingType,
  ScholarshipSource,
  CoverageType,
} from './enums/scholarship.enums';
import { Country } from './country.entity';
import { DegreeType } from './degree-type.entity';
import { FieldOfStudy } from './field-of-study.entity';
import { SavedScholarship } from './saved-schol.entity';
import { ScholarshipApplication } from './schol-application.entity';
import { Program } from '../../programs/entities/program.entity';
import { School } from '../../schools/entities/school.entity';

@Entity('scholarships')
@Index('ft_scholarship_search', ['title', 'description'], { fulltext: true })
export class Scholarship extends SoftDeletableEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: false,
    comment: 'SEO-friendly URL identifier',
  })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Eligibility criteria and requirements',
  })
  eligibility: string | null;

  @Index('idx_funding_type')
  @Column({
    name: 'funding_type',
    type: 'enum',
    enum: FundingType,
    default: FundingType.UNKNOWN,
  })
  fundingType: FundingType;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Array of coverage types: tuition, living, travel, etc.',
  })
  coverage: CoverageType[] | null;

  @Column({
    name: 'application_url',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'External application link',
  })
  applicationUrl: string | null;

  @Index('idx_status')
  @Column({
    type: 'enum',
    enum: ScholarshipStatus,
    default: ScholarshipStatus.UPCOMING,
  })
  status: ScholarshipStatus;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Full scholarship value',
  })
  amount: number | null;

  @Column({
    name: 'discounted_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Discounted amount if applicable',
  })
  discountedAmount: number | null;

  @Column({
    type: 'char',
    length: 3,
    nullable: true,
    comment: 'ISO 4217 currency code e.g USD, GBP',
  })
  currency: string | null;

  @Index('idx_source')
  @Column({
    type: 'enum',
    enum: ScholarshipSource,
    default: ScholarshipSource.ADMIN,
  })
  source: ScholarshipSource;

  @Column({
    name: 'source_url',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Origin URL if scraped/imported',
  })
  sourceUrl: string | null;

  @Index('idx_deadline')
  @Column({ type: 'date', nullable: true })
  deadline: Date | null;

  @Index('idx_is_published')
  @Column({
    name: 'is_published',
    type: 'boolean',
    default: false,
    comment: 'Published and visible to students',
  })
  isPublished: boolean;

  @Column({
    name: 'is_featured',
    type: 'boolean',
    default: false,
    comment: 'Featured/highlighted scholarship',
  })
  isFeatured: boolean;

  @Column({
    name: 'created_by',
    type: 'bigint',
    nullable: true,
    comment: 'FK to users table - admin who created it',
  })
  createdBy: number | null;

  // Many to many relationships
  @ManyToMany(() => Country, (country) => country.eligibleForScholarships, {
    cascade: true,
  })
  @JoinTable({
    name: 'scholarship_eligible_countries',
    joinColumn: { name: 'scholarship_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'country_id', referencedColumnName: 'id' },
  })
  eligibleCountries: Country[];

  @ManyToMany(() => Country, (country) => country.hostForScholarships, {
    cascade: true,
  })
  @JoinTable({
    name: 'scholarship_host_countries',
    joinColumn: { name: 'scholarship_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'country_id', referencedColumnName: 'id' },
  })
  hostCountries: Country[];

  @ManyToMany(() => DegreeType, (degreeType) => degreeType.scholarships, {
    cascade: true,
  })
  @JoinTable({
    name: 'scholarship_degree_types',
    joinColumn: { name: 'scholarship_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'degree_type_id', referencedColumnName: 'id' },
  })
  degreeTypes: DegreeType[];

  @ManyToMany(() => FieldOfStudy, (field) => field.scholarships, {
    cascade: true,
  })
  @JoinTable({
    name: 'scholarship_fields_of_study',
    joinColumn: { name: 'scholarship_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'field_id', referencedColumnName: 'id' },
  })
  fieldsOfStudy: FieldOfStudy[];

  @OneToMany(() => SavedScholarship, (saved) => saved.scholarship)
  savedByUsers: SavedScholarship[];

  @OneToMany(
    () => ScholarshipApplication,
    (application) => application.scholarship,
  )
  applications: ScholarshipApplication[];

  @ManyToMany(() => Program, (program) => program.scholarships, {
    cascade: true,
  })
  @JoinTable({
    name: 'scholarship_programs',
    joinColumn: { name: 'scholarship_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'program_id', referencedColumnName: 'id' },
  })
  programs: Program[];

  @ManyToMany(() => School, (school) => school.scholarships)
  @JoinTable({
    name: 'scholarship_schools',
    joinColumn: { name: 'scholarship_id' },
    inverseJoinColumn: { name: 'school_id' },
  })
  schools: School[];
}
