import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Scholarship } from './scholarship.entity';

@Entity('degree_types')
export class DegreeType {
  @PrimaryGeneratedColumn('increment', { type: 'tinyint' })
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Undergraduate, Masters, PhD, Diploma',
  })
  name: string;

  @ManyToMany(() => Scholarship, (scholarship) => scholarship.degreeTypes)
  scholarships: Scholarship[];
}
