import { DataSource } from 'typeorm';
import { runSeeders, Seeder } from 'typeorm-extension';
import { CountrySeeder } from './country.seeder';
import { DegreeTypeSeeder } from './degree-type.seeder';
import { FieldOfStudySeeder } from './field-of-study.seeder';
import { BlogSeeder } from './blog.seeder';

export class MainSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    await runSeeders(dataSource, {
      seeds: [CountrySeeder, DegreeTypeSeeder, FieldOfStudySeeder, BlogSeeder],
    });
  }
}
