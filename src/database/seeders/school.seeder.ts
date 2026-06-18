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

function buildDescription(uni: SeedUniversity): string {
  const typeLabel = uni.type === SchoolType.PRIVATE ? 'private' : 'public';
  const stateClause = uni.state ? ` located in ${uni.state}` : ' in Germany';
  const websiteClause = uni.website
    ? ` Visit their official website at ${uni.website} for admission requirements and programme details.`
    : '';
  return (
    `${uni.name} is a ${typeLabel} university${stateClause}, offering a wide range of academic programmes` +
    ` across undergraduate, postgraduate, and doctoral levels. As part of Germany's world-class higher education` +
    ` system, students benefit from internationally recognised qualifications, cutting-edge research facilities,` +
    ` and a diverse multicultural campus community.${websiteClause}`
  );
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
      select: ['id', 'name', 'domain', 'description'],
    });
    const existingMap = new Map(existing.map((s) => [s.name.toLowerCase(), s]));

    let created = 0;
    let updated = 0;
    const toCreate: School[] = [];
    const toUpdate: School[] = [];

    for (const uni of universities) {
      const key = uni.name.toLowerCase();
      const existing = existingMap.get(key);

      if (existing) {
        // Backfill domain and description for already-seeded schools
        if (!existing.domain && uni.domain) {
          existing.domain = uni.domain;
          existing.description = existing.description ?? buildDescription(uni);
          toUpdate.push(existing);
          updated++;
        }
        continue;
      }

      existingMap.set(key, null as unknown as School);
      toCreate.push(
        schoolRepo.create({
          name: uni.name,
          slug: generateUniqueSlug(uni.name, String(created + 1)),
          websiteUrl: uni.website ?? null,
          domain: uni.domain ?? null,
          state: uni.state ?? null,
          schoolType: uni.type ?? SchoolType.UNKNOWN,
          description: buildDescription(uni),
          country: germany,
          isActive: true,
        }),
      );
      created++;
    }

    for (let i = 0; i < toCreate.length; i += 100) {
      await schoolRepo.save(toCreate.slice(i, i + 100));
    }
    for (let i = 0; i < toUpdate.length; i += 100) {
      await schoolRepo.save(toUpdate.slice(i, i + 100));
    }

    console.log(
      `✅ German universities seeded (${created} created, ${updated} updated with domain, ${universities.length} in source)`,
    );
  }
}
