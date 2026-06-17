import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import * as fs from 'fs';
import * as path from 'path';
import { School, SchoolType } from '../../schools/entities/school.entity';
import { Country } from '../../scholarship/entities/country.entity';
import { generateUniqueSlug } from '../../common/utils/slug.util';

interface SeedUniversity {
  name: string;
  website: string | null;
  state: string | null;
  domain: string | null;
  type: SchoolType;
}

/**
 * Seeds German universities (public + private) from a bundled snapshot of the
 * Hipolabs Universities API. Idempotent: schools already present (by name
 * within Germany) are skipped.
 */
export class SchoolSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const schoolRepo = dataSource.getRepository(School);
    const countryRepo = dataSource.getRepository(Country);

    const germany = await countryRepo.findOne({ where: { name: 'Germany' } });
    if (!germany) {
      console.warn('⚠️  Germany country not found — run CountrySeeder first. Skipping schools.');
      return;
    }

    const dataFile = path.join(__dirname, 'data', 'germany-universities.json');
    const fallback = path.join(
      process.cwd(),
      'src',
      'database',
      'seeders',
      'data',
      'germany-universities.json',
    );
    const file = fs.existsSync(dataFile) ? dataFile : fallback;
    if (!fs.existsSync(file)) {
      console.warn('⚠️  germany-universities.json not found. Skipping schools.');
      return;
    }

    const universities: SeedUniversity[] = JSON.parse(
      fs.readFileSync(file, 'utf-8'),
    );

    const existing = await schoolRepo.find({
      where: { country: { id: germany.id } },
      select: ['id', 'name'],
    });
    const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));

    let created = 0;
    const batch: School[] = [];
    for (const uni of universities) {
      if (existingNames.has(uni.name.toLowerCase())) continue;
      existingNames.add(uni.name.toLowerCase());
      batch.push(
        schoolRepo.create({
          name: uni.name,
          slug: generateUniqueSlug(uni.name, String(created + 1)),
          websiteUrl: uni.website ?? null,
          state: uni.state ?? null,
          schoolType: uni.type ?? SchoolType.UNKNOWN,
          country: germany,
          isActive: true,
        }),
      );
      created++;
    }

    for (let i = 0; i < batch.length; i += 100) {
      await schoolRepo.save(batch.slice(i, i + 100));
    }

    console.log(
      `✅ German universities seeded (${created} created, ${universities.length} in source)`,
    );
  }
}
