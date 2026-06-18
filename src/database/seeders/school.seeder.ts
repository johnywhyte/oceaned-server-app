import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import * as fs from 'fs';
import * as path from 'path';
import { School, SchoolType } from '../../schools/entities/school.entity';
import { Country } from '../../scholarship/entities/country.entity';
import { generateUniqueSlug } from '../../common/utils/slug.util';
import { UniversitiesApiService } from '../../schools/universities-api.service';

interface SeedUniversity {
  name: string;
  website: string | null;
  state: string | null;
  domain: string | null;
  type: SchoolType;
}

/** Partner countries to populate, in priority order. */
const PARTNER_COUNTRIES = [
  'Germany',
  'Netherlands',
  'United Kingdom',
  'Canada',
  'Estonia',
  'New Zealand',
];

function buildDescription(uni: SeedUniversity, countryName: string): string {
  const typeLabel = uni.type === SchoolType.PRIVATE ? 'private' : 'public';
  const stateClause = uni.state ? ` located in ${uni.state}` : ` in ${countryName}`;
  const websiteClause = uni.website
    ? ` Visit ${uni.website} for admission requirements and programme details.`
    : '';
  return (
    `${uni.name} is a ${typeLabel} university${stateClause}, offering a wide range of academic programmes` +
    ` across undergraduate, postgraduate, and doctoral levels. Students benefit from internationally recognised` +
    ` qualifications, strong research facilities, and a diverse, multicultural campus community.${websiteClause}`
  );
}

/**
 * Seeds universities for OCEANED's partner countries. Germany uses the bundled
 * Hipolabs snapshot (offline-safe); the remaining countries are fetched live
 * from the Hipolabs Universities API. Idempotent: schools already present (by
 * name within their country) are skipped, and missing domains are backfilled.
 */
export class SchoolSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const schoolRepo = dataSource.getRepository(School);
    const countryRepo = dataSource.getRepository(Country);
    const api = new UniversitiesApiService();

    for (const countryName of PARTNER_COUNTRIES) {
      const country = await countryRepo.findOne({ where: { name: countryName } });
      if (!country) {
        console.warn(`⚠️  Country "${countryName}" not found — skipping.`);
        continue;
      }

      const universities = await this.loadUniversities(countryName, api);
      if (universities.length === 0) {
        console.warn(`⚠️  No universities found for ${countryName} — skipping.`);
        continue;
      }

      const existing = await schoolRepo.find({
        where: { country: { id: country.id } },
        select: ['id', 'name', 'domain', 'description'],
      });
      const existingMap = new Map(existing.map((s) => [s.name.toLowerCase(), s]));

      let created = 0;
      let updated = 0;
      const toCreate: School[] = [];
      const toUpdate: School[] = [];

      for (const uni of universities) {
        const key = uni.name.toLowerCase();
        const found = existingMap.get(key);

        if (found) {
          if (!found.domain && uni.domain) {
            found.domain = uni.domain;
            found.description = found.description ?? buildDescription(uni, countryName);
            toUpdate.push(found);
            updated++;
          }
          continue;
        }

        existingMap.set(key, null as unknown as School);
        toCreate.push(
          schoolRepo.create({
            name: uni.name,
            slug: generateUniqueSlug(uni.name, `${country.code}-${created + 1}`),
            websiteUrl: uni.website ?? null,
            domain: uni.domain ?? null,
            state: uni.state ?? null,
            schoolType: uni.type ?? SchoolType.UNKNOWN,
            description: buildDescription(uni, countryName),
            country,
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
        `✅ ${countryName}: ${created} created, ${updated} domains backfilled (${universities.length} in source)`,
      );
    }
  }

  private async loadUniversities(
    countryName: string,
    api: UniversitiesApiService,
  ): Promise<SeedUniversity[]> {
    // Germany ships with a bundled snapshot — prefer it (offline-safe).
    if (countryName === 'Germany') {
      const snapshot = this.loadGermanySnapshot();
      if (snapshot.length > 0) return snapshot;
    }
    try {
      return await api.fetchByCountry(countryName);
    } catch (err) {
      console.warn(`⚠️  Live fetch failed for ${countryName}: ${(err as Error).message}`);
      return [];
    }
  }

  private loadGermanySnapshot(): SeedUniversity[] {
    const candidates = [
      path.join(__dirname, 'data', 'germany-universities.json'),
      path.join(process.cwd(), 'src', 'database', 'seeders', 'data', 'germany-universities.json'),
    ];
    for (const file of candidates) {
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf-8')) as SeedUniversity[];
      }
    }
    return [];
  }
}
