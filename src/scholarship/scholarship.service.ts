import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Scholarship } from './entities/scholarship.entity';
import { Country } from './entities/country.entity';
import { DegreeType } from './entities/degree-type.entity';
import { FieldOfStudy } from './entities/field-of-study.entity';
import { Program } from '../programs/entities/program.entity';
import { ScholarshipRepository } from './scholarship.repository';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import { FilterScholarshipDto } from './dto/filter-scholarship.dto';
import {
  FundingType,
  ScholarshipSource,
  ScholarshipStatus,
} from './entities/enums/scholarship.enums';
import { generateSlug } from 'src/common/utils/slug.util';

@Injectable()
export class ScholarshipService {
  constructor(
    private readonly scholarshipRepository: ScholarshipRepository,

    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,

    @InjectRepository(DegreeType)
    private readonly degreeTypeRepository: Repository<DegreeType>,

    @InjectRepository(FieldOfStudy)
    private readonly fieldOfStudyRepository: Repository<FieldOfStudy>,

    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
  ) {}

  async getCountries() {
    return this.countryRepository.find({ order: { name: 'ASC' } });
  }

  async getDegreeTypes() {
    return this.degreeTypeRepository.find({ order: { name: 'ASC' } });
  }

  async getFieldsOfStudy() {
    return this.fieldOfStudyRepository.find({ order: { name: 'ASC' } });
  }

  // Public

  async getPublishedScholarships(filters: FilterScholarshipDto) {
    const { data, total } =
      await this.scholarshipRepository.findAllPublished(filters);
    const { page = 1, limit = 20 } = filters;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPublishedScholarshipBySlug(slug: string) {
    const scholarship =
      await this.scholarshipRepository.findOnePublishedBySlug(slug);

    if (!scholarship) {
      throw new NotFoundException(`Scholarship not found`);
    }

    return scholarship;
  }

  // Admin
  async getAllScholarships(filters: FilterScholarshipDto) {
    const { data, total } = await this.scholarshipRepository.findAll(filters);
    const { page = 1, limit = 20 } = filters;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getScholarshipById(id: number) {
    const scholarship = await this.scholarshipRepository.findOneById(id);

    if (!scholarship) {
      throw new NotFoundException(`Scholarship not found`);
    }

    return scholarship;
  }

  async createScholarship(dto: CreateScholarshipDto, adminId: number) {
    const slug = await this.generateUniqueSlug(
      dto.title,
      dto.fundingType,
      dto.deadline,
    );
    // scholarship.title = dto.title;
    // scholarship.slug = await this.generateUniqueSlug(
    //   dto.title,
    //   dto.fundingType,
    //   dto.deadline,
    // );

    // If base slug exists it means a scholarship with same title+fundingType+year already exists
    const baseSlug = generateSlug(
      [
        dto.title,
        dto.fundingType && dto.fundingType !== FundingType.UNKNOWN
          ? dto.fundingType
          : null,
        dto.deadline ? String(new Date(dto.deadline).getFullYear()) : null,
      ]
        .filter(Boolean)
        .join(' '),
    );

    const isDuplicate = await this.scholarshipRepository.existsBySlug(baseSlug);
    if (isDuplicate) {
      throw new ConflictException(
        `A scholarship with the same title, funding type, and deadline year already exists`,
      );
    }

    const scholarship = new Scholarship();
    scholarship.slug = slug;

    scholarship.title = dto.title;
    scholarship.description = dto.description ?? null;
    scholarship.eligibility = dto.eligibility ?? null;
    scholarship.fundingType = dto.fundingType ?? FundingType.UNKNOWN;
    scholarship.coverage = dto.coverage ?? null;
    scholarship.applicationUrl = dto.applicationUrl ?? null;
    scholarship.status = dto.status ?? ScholarshipStatus.UPCOMING;
    scholarship.amount = dto.amount ?? null;
    scholarship.discountedAmount = dto.discountedAmount ?? null;
    scholarship.currency = dto.currency ?? null;
    scholarship.source = dto.source ?? ScholarshipSource.ADMIN;
    scholarship.sourceUrl = dto.sourceUrl ?? null;
    scholarship.deadline = dto.deadline ? new Date(dto.deadline) : null;
    scholarship.createdBy = adminId;

    if (
      dto.discountedAmount &&
      dto.amount &&
      dto.discountedAmount > dto.amount
    ) {
      throw new BadRequestException(
        'Discounted amount cannot be greater than the full amount',
      );
    }

    // Resolve relationships
    if (dto.eligibleCountryIds?.length) {
      scholarship.eligibleCountries = await this.resolveCountries(
        dto.eligibleCountryIds,
      );
    }

    if (dto.hostCountryIds?.length) {
      scholarship.hostCountries = await this.resolveCountries(
        dto.hostCountryIds,
      );
    }

    if (dto.degreeTypeIds?.length) {
      scholarship.degreeTypes = await this.resolveDegreeTypes(
        dto.degreeTypeIds,
      );
    }

    if (dto.fieldOfStudyIds?.length) {
      scholarship.fieldsOfStudy = await this.resolveFieldsOfStudy(
        dto.fieldOfStudyIds,
      );
    }

    if (dto.programIds?.length) {
      scholarship.programs = await this.resolvePrograms(dto.programIds);
    }

    return this.scholarshipRepository.save(scholarship);
  }

  async updateScholarship(id: number, dto: UpdateScholarshipDto) {
    const scholarship = await this.getScholarshipById(id);

    // Regenerate slug only if title, fundingType or deadline changed
    const titleChanged = dto.title && dto.title !== scholarship.title;
    const fundingTypeChanged =
      dto.fundingType && dto.fundingType !== scholarship.fundingType;
    const deadlineChanged =
      dto.deadline !== undefined &&
      new Date(dto.deadline).getFullYear() !==
        scholarship.deadline?.getFullYear();

    if (titleChanged || fundingTypeChanged || deadlineChanged) {
      const newTitle = dto.title ?? scholarship.title;
      const newFundingType = dto.fundingType ?? scholarship.fundingType;
      const newDeadline = dto.deadline ?? scholarship.deadline?.toISOString();
      scholarship.slug = await this.generateUniqueSlug(
        newTitle,
        newFundingType,
        newDeadline,
        id,
      );
    }

    // Update scalar fields
    Object.assign(scholarship, {
      ...(dto.title && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.eligibility !== undefined && { eligibility: dto.eligibility }),
      ...(dto.fundingType && { fundingType: dto.fundingType }),
      ...(dto.coverage !== undefined && { coverage: dto.coverage }),
      ...(dto.applicationUrl !== undefined && {
        applicationUrl: dto.applicationUrl,
      }),
      ...(dto.status && { status: dto.status }),
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.discountedAmount !== undefined && {
        discountedAmount: dto.discountedAmount,
      }),
      ...(dto.currency !== undefined && { currency: dto.currency }),
      ...(dto.source && { source: dto.source }),
      ...(dto.sourceUrl !== undefined && { sourceUrl: dto.sourceUrl }),
      ...(dto.deadline !== undefined && {
        deadline: dto.deadline ? new Date(dto.deadline) : null,
      }),
    });

    if (
      dto.discountedAmount &&
      dto.amount &&
      dto.discountedAmount > dto.amount
    ) {
      throw new BadRequestException(
        'Discounted amount cannot be greater than the full amount',
      );
    }

    // Update relationships if provided
    if (dto.eligibleCountryIds) {
      scholarship.eligibleCountries = await this.resolveCountries(
        dto.eligibleCountryIds,
      );
    }

    if (dto.hostCountryIds) {
      scholarship.hostCountries = await this.resolveCountries(
        dto.hostCountryIds,
      );
    }

    if (dto.degreeTypeIds) {
      scholarship.degreeTypes = await this.resolveDegreeTypes(
        dto.degreeTypeIds,
      );
    }

    if (dto.fieldOfStudyIds) {
      scholarship.fieldsOfStudy = await this.resolveFieldsOfStudy(
        dto.fieldOfStudyIds,
      );
    }

    if (dto.programIds) {
      scholarship.programs = await this.resolvePrograms(dto.programIds);
    }

    return this.scholarshipRepository.save(scholarship);
  }

  async deleteScholarship(id: number) {
    await this.getScholarshipById(id);
    await this.scholarshipRepository.softDelete(id);
  }

  async setPublishStatus(id: number, publish: boolean) {
    const scholarship = await this.getScholarshipById(id);
    scholarship.isPublished = publish;
    return this.scholarshipRepository.save(scholarship);
  }

  // Private helpers

  private async generateUniqueSlug(
    title: string,
    fundingType?: FundingType,
    deadline?: string | Date,
    excludeId?: number,
  ): Promise<string> {
    const year = deadline ? new Date(deadline).getFullYear() : null;

    // Build base slug from title + fundingType + year
    const parts = [
      title,
      fundingType && fundingType !== FundingType.UNKNOWN ? fundingType : null,
      year ? String(year) : null,
    ]
      .filter(Boolean)
      .join(' ');

    const baseSlug = generateSlug(parts);

    // Check if base slug is available
    const baseExists = await this.scholarshipRepository.existsBySlug(
      baseSlug,
      excludeId,
    );
    if (!baseExists) return baseSlug;

    // Fall back to base slug + timestamp
    const fallbackSlug = generateSlug(`${parts} ${Date.now()}`);
    return fallbackSlug;
  }

  private async resolveCountries(ids: number[]): Promise<Country[]> {
    const countries = await this.countryRepository.findBy({ id: In(ids) });
    if (countries.length !== ids.length) {
      throw new BadRequestException(`One or more country IDs are invalid`);
    }
    return countries;
  }

  private async resolveDegreeTypes(ids: number[]): Promise<DegreeType[]> {
    const degreeTypes = await this.degreeTypeRepository.findBy({ id: In(ids) });
    if (degreeTypes.length !== ids.length) {
      throw new BadRequestException(`One or more degree type IDs are invalid`);
    }
    return degreeTypes;
  }

  private async resolveFieldsOfStudy(ids: number[]): Promise<FieldOfStudy[]> {
    const fields = await this.fieldOfStudyRepository.findBy({ id: In(ids) });
    if (fields.length !== ids.length) {
      throw new BadRequestException(
        `One or more field of study IDs are invalid`,
      );
    }
    return fields;
  }

  private async resolvePrograms(ids: number[]): Promise<Program[]> {
    const programs = await this.programRepository.findBy({ id: In(ids) });
    if (programs.length !== ids.length) {
      throw new BadRequestException(`One or more program IDs are invalid`);
    }
    return programs;
  }
}
