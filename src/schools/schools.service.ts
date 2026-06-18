import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './entities/school.entity';
import { Country } from '../scholarship/entities/country.entity';
import { Program } from '../programs/entities/program.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { FilterSchoolDto } from './dto/filter-school.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { AcademicCalendarService, AcademicSession } from './academic-calendar.service';
import { UniversitiesApiService } from './universities-api.service';
import { SchoolType } from './entities/school.entity';
import { generateUniqueSlug } from '../common/utils/slug.util';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,

    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,

    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,

    private readonly cloudinaryService: CloudinaryService,
    private readonly academicCalendar: AcademicCalendarService,
    private readonly universitiesApi: UniversitiesApiService,
  ) {}

  /** Attaches a computed academic-session status based on the school's country. */
  private withSession<T extends School>(
    school: T,
  ): T & { session: AcademicSession } {
    const session = this.academicCalendar.getSession(school.country?.code);
    return Object.assign(school, { session });
  }

  // Private Helpers

  private async resolveCountry(countryId: number): Promise<Country> {
    const country = await this.countryRepository.findOne({
      where: { id: countryId },
    });
    if (!country) throw new BadRequestException('Country was not found.');
    return country;
  }

  private async findOneOrFail(id: number): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { id },
      relations: ['country'],
    });
    if (!school) throw new NotFoundException(`School not found.`);
    return school;
  }

  // Admin Operations

  async create(dto: CreateSchoolDto): Promise<School> {
    const country = await this.resolveCountry(dto.countryId);

    // Add check for existing school
    const existingSchool = await this.schoolRepository.findOne({
      where: { name: dto.name, country: { id: dto.countryId } },
    });
    if (existingSchool) {
      throw new ConflictException(
        'A school with this name already exists in the selected country.',
      );
    }

    const school = this.schoolRepository.create({
      ...dto,
      slug: generateUniqueSlug(dto.name),
      country,
    });

    return this.schoolRepository.save(school);
  }

  /**
   * Bulk-import universities for a country from the external Universities API
   * (with offline snapshot fallback). Existing schools (matched by name within
   * the country) are skipped so the import is idempotent.
   */
  async importFromApi(
    countryName: string,
  ): Promise<{ imported: number; skipped: number; total: number }> {
    const country = await this.countryRepository.findOne({
      where: { name: countryName },
    });
    if (!country) {
      throw new BadRequestException(
        `Country "${countryName}" is not seeded. Run the country seeder first.`,
      );
    }

    const universities = await this.universitiesApi.fetchByCountry(countryName);
    if (universities.length === 0) {
      throw new BadRequestException(
        `No universities returned for "${countryName}".`,
      );
    }

    const existing = await this.schoolRepository.find({
      where: { country: { id: country.id } },
      select: ['id', 'name'],
    });
    const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));

    let imported = 0;
    let skipped = 0;
    const toSave: School[] = [];

    for (const uni of universities) {
      if (existingNames.has(uni.name.toLowerCase())) {
        skipped++;
        continue;
      }
      existingNames.add(uni.name.toLowerCase());
      toSave.push(
        this.schoolRepository.create({
          name: uni.name,
          slug: generateUniqueSlug(uni.name, String(Date.now() + imported)),
          websiteUrl: uni.website ?? null,
          domain: uni.domain ?? null,
          state: uni.state ?? null,
          schoolType: uni.type ?? SchoolType.UNKNOWN,
          country,
          isActive: true,
        }),
      );
      imported++;
    }

    // Save in chunks to avoid oversized queries.
    for (let i = 0; i < toSave.length; i += 100) {
      await this.schoolRepository.save(toSave.slice(i, i + 100));
    }

    return { imported, skipped, total: universities.length };
  }

  async findAll(query: FilterSchoolDto): Promise<PaginatedResult<School>> {
    const {
      search,
      countryId,
      partnerStatus,
      schoolType,
      isActive,
      city,
      state,
      page = 1,
      limit = 10,
    } = query;

    const qb = this.schoolRepository
      .createQueryBuilder('school')
      .leftJoinAndSelect('school.country', 'country')
      .orderBy('school.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('school.name LIKE :search', { search: `%${search}%` });
    }

    if (countryId) {
      qb.andWhere('country.id = :countryId', { countryId });
    }

    if (partnerStatus) {
      qb.andWhere('school.partnerStatus = :partnerStatus', { partnerStatus });
    }

    if (schoolType) {
      qb.andWhere('school.schoolType = :schoolType', { schoolType });
    }

    if (isActive !== undefined) {
      qb.andWhere('school.isActive = :isActive', { isActive });
    }

    if (city) {
      qb.andWhere('school.city LIKE :city', { city: `%${city}%` });
    }

    if (state) {
      qb.andWhere('school.state LIKE :state', { state: `%${state}%` });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((s) => this.withSession(s)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Deterministic, multi-country recommendation set used by BOTH the public
   * lead form and the logged-in dashboard, so a user sees a consistent list
   * for the same preferences. When a country is given it filters to it;
   * otherwise it diversifies across all partner countries instead of returning
   * an alphabetical (German-heavy) page. `course` is applied as a soft filter
   * with a graceful fallback so results never come back empty.
   */
  async recommend(opts: {
    country?: string;
    course?: string;
    limit?: number;
  }): Promise<School[]> {
    const limit = opts.limit ?? 6;
    const country = opts.country;

    const buildBase = () => {
      const qb = this.schoolRepository
        .createQueryBuilder('school')
        .leftJoinAndSelect('school.country', 'country')
        .where('school.isActive = :active', { active: true })
        .orderBy('school.partnerStatus', 'DESC')
        .addOrderBy('school.ranking', 'ASC')
        .addOrderBy('school.name', 'ASC');
      if (country) qb.andWhere('country.name = :country', { country });
      return qb;
    };

    // Soft course match (school name / description) with fallback.
    const withCourse = (qb: ReturnType<typeof buildBase>) => {
      if (opts.course) {
        qb.andWhere(
          '(school.name LIKE :c OR school.description LIKE :c)',
          { c: `%${opts.course}%` },
        );
      }
      return qb;
    };

    // Single-country (or course-filtered) path.
    if (country || opts.course) {
      let rows = await withCourse(buildBase()).take(limit).getMany();
      if (rows.length < limit) {
        // Fill remaining slots ignoring the soft course filter.
        const fill = await buildBase()
          .take(limit)
          .getMany();
        const seen = new Set(rows.map((r) => r.id));
        for (const f of fill) {
          if (rows.length >= limit) break;
          if (!seen.has(f.id)) {
            rows.push(f);
            seen.add(f.id);
          }
        }
      }
      return rows.slice(0, limit).map((s) => this.withSession(s));
    }

    // No country: diversify across partner countries deterministically.
    const partnerCountries = [
      'Germany',
      'United Kingdom',
      'Canada',
      'Netherlands',
      'Estonia',
      'New Zealand',
    ];
    const perCountry = Math.max(1, Math.ceil(limit / partnerCountries.length));
    const out: School[] = [];
    for (const c of partnerCountries) {
      const rows = await this.schoolRepository
        .createQueryBuilder('school')
        .leftJoinAndSelect('school.country', 'country')
        .where('school.isActive = :active', { active: true })
        .andWhere('country.name = :c', { c })
        .orderBy('school.partnerStatus', 'DESC')
        .addOrderBy('school.ranking', 'ASC')
        .addOrderBy('school.name', 'ASC')
        .take(perCountry)
        .getMany();
      out.push(...rows);
    }
    return out.slice(0, limit).map((s) => this.withSession(s));
  }

  async findOne(id: number): Promise<School> {
    const school = await this.findOneOrFail(id);
    return this.withSession(school);
  }

  /** Public: academic session status for a single school. */
  async getSession(id: number): Promise<AcademicSession> {
    const school = await this.findOneOrFail(id);
    return this.academicCalendar.getSession(school.country?.code);
  }

  /** Distinct list of states for schools in a country (for filter UIs). */
  async getStates(countryId?: number): Promise<string[]> {
    const qb = this.schoolRepository
      .createQueryBuilder('school')
      .select('DISTINCT school.state', 'state')
      .where('school.state IS NOT NULL')
      .andWhere('school.isActive = :active', { active: true })
      .orderBy('school.state', 'ASC');
    if (countryId) qb.andWhere('school.country_id = :countryId', { countryId });
    const rows = await qb.getRawMany<{ state: string }>();
    return rows.map((r) => r.state).filter(Boolean);
  }

  async update(id: number, dto: UpdateSchoolDto): Promise<School> {
    const school = await this.findOneOrFail(id);

    if (dto.countryId) {
      school.country = await this.resolveCountry(dto.countryId);
    }

    Object.assign(school, dto);

    return this.schoolRepository.save(school);
  }

  async findAllForDropdown(
    search?: string,
  ): Promise<Pick<School, 'id' | 'name'>[]> {
    const qb = this.schoolRepository
      .createQueryBuilder('school')
      .select(['school.id', 'school.name'])
      .where('school.isActive = :isActive', { isActive: true })
      .orderBy('school.name', 'ASC')
      .take(20);

    if (search) {
      qb.andWhere('school.name LIKE :search', { search: `%${search}%` });
    }

    return qb.getMany();
  }

  async remove(id: number): Promise<void> {
    const school = await this.findOneOrFail(id);
    await this.schoolRepository.softDelete(school.id);
  }

  // Activate / Deactivate

  async setActiveStatus(id: number, isActive: boolean): Promise<School> {
    const school = await this.findOneOrFail(id);
    school.isActive = isActive;
    return this.schoolRepository.save(school);
  }

  // Dependent Dropdown

  async getPrograms(schoolId: number): Promise<Program[]> {
    await this.findOneOrFail(schoolId);

    return this.programRepository.find({
      where: { school: { id: schoolId }, isActive: true },
      relations: ['degreeType'],
      order: { courseName: 'ASC' },
    });
  }

  // Upload logo

  async uploadLogo(id: number, file: Express.Multer.File): Promise<School> {
    const school = await this.findOneOrFail(id);

    // Delete old logo from Cloudinary if it exists
    if (school.logoPublicId) {
      await this.cloudinaryService.deleteImage(school.logoPublicId);
    }

    const { url, publicId } = await this.cloudinaryService.uploadImage(
      file,
      'oceaned/schools',
    );

    school.logoUrl = url;
    school.logoPublicId = publicId;

    return this.schoolRepository.save(school);
  }

  // Remove logo

  async removeLogo(id: number): Promise<School> {
    const school = await this.findOneOrFail(id);

    if (!school.logoPublicId) {
      throw new BadRequestException('School does not have a logo to remove.');
    }

    await this.cloudinaryService.deleteImage(school.logoPublicId);

    school.logoUrl = null;
    school.logoPublicId = null;

    return this.schoolRepository.save(school);
  }
}
