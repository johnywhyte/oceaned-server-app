import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Scholarship } from './entities/scholarship.entity';
import { FilterScholarshipDto } from './dto/filter-scholarship.dto';

@Injectable()
export class ScholarshipRepository {
  constructor(
    @InjectRepository(Scholarship)
    private readonly repository: Repository<Scholarship>,
  ) {}

  // Public: List with filters
  async findAllPublished(
    filters: FilterScholarshipDto,
  ): Promise<{ data: Scholarship[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      search,
      eligibleCountryId,
      hostCountryId,
      degreeTypeId,
      fieldOfStudyId,
      fundingType,
      status,
      coverageType,
      deadlineBefore,
    } = filters;

    const qb = this.repository
      .createQueryBuilder('scholarship')
      .leftJoinAndSelect('scholarship.eligibleCountries', 'eligibleCountry')
      .leftJoinAndSelect('scholarship.hostCountries', 'hostCountry')
      .leftJoinAndSelect('scholarship.degreeTypes', 'degreeType')
      .leftJoinAndSelect('scholarship.fieldsOfStudy', 'fieldOfStudy')
      .where('scholarship.isPublished = :isPublished', { isPublished: true })
      .andWhere('scholarship.deletedAt IS NULL');

    this.applyFilters(qb, {
      search,
      eligibleCountryId,
      hostCountryId,
      degreeTypeId,
      fieldOfStudyId,
      fundingType,
      status,
      coverageType,
      deadlineBefore,
    });

    const [data, total] = await qb
      .orderBy('scholarship.isFeatured', 'DESC')
      .addOrderBy('scholarship.deadline', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  // Public: Single scholarship
  async findOnePublishedBySlug(slug: string): Promise<Scholarship | null> {
    return this.repository
      .createQueryBuilder('scholarship')
      .leftJoinAndSelect('scholarship.eligibleCountries', 'eligibleCountry')
      .leftJoinAndSelect('scholarship.hostCountries', 'hostCountry')
      .leftJoinAndSelect('scholarship.degreeTypes', 'degreeType')
      .leftJoinAndSelect('scholarship.fieldsOfStudy', 'fieldOfStudy')
      .leftJoinAndSelect('scholarship.programs', 'program')
      .leftJoinAndSelect('program.school', 'school')
      .where('scholarship.slug = :slug', { slug })
      .andWhere('scholarship.isPublished = :isPublished', { isPublished: true })
      .andWhere('scholarship.deletedAt IS NULL')
      .getOne();
  }

  // Admin: List all (including unpublished)
  async findAll(
    filters: FilterScholarshipDto,
  ): Promise<{ data: Scholarship[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      search,
      eligibleCountryId,
      hostCountryId,
      degreeTypeId,
      fieldOfStudyId,
      fundingType,
      status,
      coverageType,
      deadlineBefore,
    } = filters;

    const qb = this.repository
      .createQueryBuilder('scholarship')
      .leftJoinAndSelect('scholarship.eligibleCountries', 'eligibleCountry')
      .leftJoinAndSelect('scholarship.hostCountries', 'hostCountry')
      .leftJoinAndSelect('scholarship.degreeTypes', 'degreeType')
      .leftJoinAndSelect('scholarship.fieldsOfStudy', 'fieldOfStudy')
      .where('scholarship.deletedAt IS NULL');

    this.applyFilters(qb, {
      search,
      eligibleCountryId,
      hostCountryId,
      degreeTypeId,
      fieldOfStudyId,
      fundingType,
      status,
      coverageType,
      deadlineBefore,
    });

    const [data, total] = await qb
      .orderBy('scholarship.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  // Admin: Single scholarship by ID
  async findOneById(id: number): Promise<Scholarship | null> {
    return this.repository
      .createQueryBuilder('scholarship')
      .leftJoinAndSelect('scholarship.eligibleCountries', 'eligibleCountry')
      .leftJoinAndSelect('scholarship.hostCountries', 'hostCountry')
      .leftJoinAndSelect('scholarship.degreeTypes', 'degreeType')
      .leftJoinAndSelect('scholarship.fieldsOfStudy', 'fieldOfStudy')
      .leftJoinAndSelect('scholarship.programs', 'program')
      .where('scholarship.id = :id', { id })
      .andWhere('scholarship.deletedAt IS NULL')
      .getOne();
  }

  // Admin: Save (create & update)
  async save(scholarship: Scholarship): Promise<Scholarship> {
    return this.repository.save(scholarship);
  }

  // Admin: Soft delete
  async softDelete(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }

  // Shared: Check slug uniqueness
  async existsBySlug(slug: string, excludeId?: number): Promise<boolean> {
    const qb = this.repository
      .createQueryBuilder('scholarship')
      .where('scholarship.slug = :slug', { slug })
      .andWhere('scholarship.deletedAt IS NULL');

    if (excludeId) {
      qb.andWhere('scholarship.id != :excludeId', { excludeId });
    }

    const count = await qb.getCount();
    return count > 0;
  }

  // Private: Reusable filter logic
  private applyFilters(
    qb: SelectQueryBuilder<Scholarship>,
    filters: Omit<FilterScholarshipDto, 'page' | 'limit'>,
  ): void {
    const {
      search,
      eligibleCountryId,
      hostCountryId,
      degreeTypeId,
      fieldOfStudyId,
      fundingType,
      status,
      coverageType,
      deadlineBefore,
    } = filters;

    if (search) {
      qb.andWhere(
        '(MATCH(scholarship.title, scholarship.description) AGAINST (:search IN BOOLEAN MODE))',
        { search: `${search}*` },
      );
    }

    if (eligibleCountryId) {
      qb.andWhere('eligibleCountry.id = :eligibleCountryId', {
        eligibleCountryId,
      });
    }

    if (hostCountryId) {
      qb.andWhere('hostCountry.id = :hostCountryId', { hostCountryId });
    }

    if (degreeTypeId) {
      qb.andWhere('degreeType.id = :degreeTypeId', { degreeTypeId });
    }

    if (fieldOfStudyId) {
      qb.andWhere('fieldOfStudy.id = :fieldOfStudyId', { fieldOfStudyId });
    }

    if (fundingType) {
      qb.andWhere('scholarship.fundingType = :fundingType', { fundingType });
    }

    if (status) {
      qb.andWhere('scholarship.status = :status', { status });
    }

    if (coverageType) {
      qb.andWhere('JSON_CONTAINS(scholarship.coverage, :coverageType)', {
        coverageType: JSON.stringify(coverageType),
      });
    }

    if (deadlineBefore) {
      qb.andWhere('scholarship.deadline <= :deadlineBefore', {
        deadlineBefore,
      });
    }
  }
}
