import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { SoftDeletableEntity } from '../../common/entities/base.entity';
import { Country } from '../../scholarship/entities/country.entity';
import { Program } from '../../programs/entities/program.entity';
import { Scholarship } from '../../scholarship/entities/scholarship.entity';

export enum PartnerStatus {
  PARTNER = 'partner',
  NON_PARTNER = 'non_partner',
}

export enum SchoolType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  UNKNOWN = 'unknown',
}

@Entity('schools')
@Index('idx_schools_name', ['name'])
@Index('idx_schools_country', ['country'])
@Index('idx_schools_slug', ['slug'])
export class School extends SoftDeletableEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  slug: string | null;

  @Column({ name: 'city', type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({
    name: 'state',
    type: 'varchar',
    length: 120,
    nullable: true,
    comment: 'State / province / region (e.g., Bavaria)',
  })
  state: string | null;

  @Column({
    name: 'school_type',
    type: 'enum',
    enum: SchoolType,
    default: SchoolType.UNKNOWN,
    comment: 'public, private, or unknown',
  })
  schoolType: SchoolType;

  @Column({ name: 'website_url', type: 'varchar', length: 500, nullable: true })
  websiteUrl: string | null;

  @Column({
    name: 'domain',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Primary domain used to derive logo via Clearbit',
  })
  domain: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({
    name: 'logo_public_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  logoPublicId: string | null;

  @Column({ type: 'int', nullable: true })
  ranking: number | null;

  @Column({
    name: 'partner_status',
    type: 'enum',
    enum: PartnerStatus,
    default: PartnerStatus.NON_PARTNER,
  })
  partnerStatus: PartnerStatus;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => Country, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @OneToMany(() => Program, (program) => program.school)
  programs: Program[];

  @ManyToMany(() => Scholarship, (scholarship) => scholarship.schools)
  scholarships: Scholarship[];
}
