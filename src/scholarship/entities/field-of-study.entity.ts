import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Scholarship } from './scholarship.entity';

@Entity('fields_of_study')
export class FieldOfStudy {
  @PrimaryGeneratedColumn('increment', { type: 'smallint' })
  id: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Engineering, Medicine, Law, etc.',
  })
  name: string;

  @ManyToMany(() => Scholarship, (scholarship) => scholarship.fieldsOfStudy)
  scholarships: Scholarship[];
}
