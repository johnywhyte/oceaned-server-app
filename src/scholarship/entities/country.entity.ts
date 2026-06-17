import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Scholarship } from './scholarship.entity';

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn('increment', { type: 'smallint' })
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({
    type: 'char',
    length: 2,
    unique: true,
    nullable: false,
    comment: 'ISO 3166-1 alpha-2 (e.g., NG, GB, US)',
  })
  code: string;

  // Inverse side of eligible countries relationship
  @ManyToMany(() => Scholarship, (scholarship) => scholarship.eligibleCountries)
  eligibleForScholarships: Scholarship[];

  // Inverse side of host countries relationship
  @ManyToMany(() => Scholarship, (scholarship) => scholarship.hostCountries)
  hostForScholarships: Scholarship[];
}
