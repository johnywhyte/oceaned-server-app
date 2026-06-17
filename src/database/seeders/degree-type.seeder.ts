import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { DegreeType } from '../../scholarship/entities/degree-type.entity';

const degreeTypes = [
  { name: 'Diploma' },
  { name: 'Undergraduate' },
  { name: 'Masters' },
  { name: 'PhD' },
  { name: 'Postdoctoral' },
  { name: 'Certificate' },
  { name: 'Associate Degree' },
];

export class DegreeTypeSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(DegreeType);

    for (const degreeType of degreeTypes) {
      const exists = await repository.findOneBy({ name: degreeType.name });
      if (!exists) {
        await repository.save(repository.create(degreeType));
      }
    }

    console.log(`✅ Degree types seeded (${degreeTypes.length} records)`);
  }
}
