import { Injectable, Logger } from '@nestjs/common';
import { SchoolType } from './entities/school.entity';
import * as fs from 'fs';
import * as path from 'path';

export interface ExternalUniversity {
  name: string;
  website: string | null;
  state: string | null;
  domain: string | null;
  type: SchoolType;
}

interface HipolabsUniversity {
  name: string;
  country: string;
  'state-province': string | null;
  web_pages?: string[];
  domains?: string[];
  alpha_two_code?: string;
}

/**
 * Integrates the free Hipolabs Universities API
 * (http://universities.hipolabs.com) to source the list of universities for a
 * country. The API does not classify public vs private, so a heuristic based
 * on legal form / well-known private institutions is applied. A bundled JSON
 * snapshot is used as an offline fallback when the API is unreachable.
 */
@Injectable()
export class UniversitiesApiService {
  private readonly logger = new Logger(UniversitiesApiService.name);
  private static readonly BASE = 'http://universities.hipolabs.com/search';

  private static readonly PRIVATE_KEYS = [
    'gmbh', 'ggmbh', 'private', 'privat', 'business school', 'school of', ' fom',
    'iu ', 'iubh', 'srh', 'fresenius', 'macromedia', 'steinbeis', 'ebs', 'whu',
    'hertie', 'jacobs', 'witten', 'herdecke', 'zeppelin', 'bucerius',
    'frankfurt school', 'code university', 'gisma', 'esmt', 'escp',
    'cologne business', 'international school of management', ' ism', 'hhl',
    'kühne', 'kuehne', 'karlshochschule', 'akad', 'apollon', 'bits', 'bsp',
    'quadriga', 'bbw', 'bard', 'touro', 'schiller', 'constructor',
    'new european', 'mediadesign', 'hmkw', 'dekra', 'diploma', 'euro-fh',
    'europäische fernhochschule', 'ue ', 'university of europe', 'accadis',
    'allensbach', 'wings', 'victoria', 'xu exponential', 'cbs', 'klu',
    'provadis',
  ];

  classifyType(name: string): SchoolType {
    const low = name.toLowerCase();
    return UniversitiesApiService.PRIVATE_KEYS.some((k) => low.includes(k))
      ? SchoolType.PRIVATE
      : SchoolType.PUBLIC;
  }

  /**
   * Fetch universities for a country from the live API, falling back to the
   * bundled snapshot for Germany when the network is unavailable.
   */
  async fetchByCountry(country: string): Promise<ExternalUniversity[]> {
    const url = `${UniversitiesApiService.BASE}?country=${encodeURIComponent(country)}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as HipolabsUniversity[];
      this.logger.log(`Fetched ${data.length} universities for ${country} from Hipolabs API`);
      return this.mapHipolabs(data);
    } catch (err) {
      this.logger.warn(
        `Universities API unavailable for ${country} (${(err as Error).message}); using bundled snapshot if present.`,
      );
      return this.loadSnapshot(country);
    }
  }

  private mapHipolabs(rows: HipolabsUniversity[]): ExternalUniversity[] {
    const seen = new Set<string>();
    const out: ExternalUniversity[] = [];
    for (const u of rows) {
      const name = (u.name || '').trim();
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      out.push({
        name,
        website: u.web_pages?.[0] ?? null,
        state: u['state-province'] ?? null,
        domain: u.domains?.[0] ?? null,
        type: this.classifyType(name),
      });
    }
    return out;
  }

  private loadSnapshot(country: string): ExternalUniversity[] {
    if (country.toLowerCase() !== 'germany') return [];
    try {
      const file = path.join(
        __dirname,
        '..',
        'database',
        'seeders',
        'data',
        'germany-universities.json',
      );
      // When running from dist the JSON lives under src; resolve both.
      const candidates = [
        file,
        path.join(process.cwd(), 'src', 'database', 'seeders', 'data', 'germany-universities.json'),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          return JSON.parse(fs.readFileSync(c, 'utf-8')) as ExternalUniversity[];
        }
      }
    } catch (err) {
      this.logger.error(`Failed to load Germany snapshot: ${(err as Error).message}`);
    }
    return [];
  }
}
