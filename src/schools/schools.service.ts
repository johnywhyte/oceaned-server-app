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
  ) {}

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
      country,
    });

    return this.schoolRepository.save(school);
  }

  async findAll(query: FilterSchoolDto): Promise<PaginatedResult<School>> {
    const {
      countryId,
      partnerStatus,
      isActive,
      city,
      page = 1,
      limit = 10,
    } = query;

    const qb = this.schoolRepository
      .createQueryBuilder('school')
      .leftJoinAndSelect('school.country', 'country')
      .orderBy('school.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (countryId) {
      qb.andWhere('school.country = :countryId', { countryId });
    }

    if (partnerStatus) {
      qb.andWhere('school.partnerStatus = :partnerStatus', { partnerStatus });
    }

    if (isActive !== undefined) {
      qb.andWhere('school.isActive = :isActive', { isActive });
    }

    if (city) {
      qb.andWhere('school.city LIKE :city', { city: `%${city}%` });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number): Promise<School> {
    return this.findOneOrFail(id);
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
