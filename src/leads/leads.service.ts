import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { School } from '../schools/entities/school.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(School)
    private readonly schoolRepo: Repository<School>,
  ) {}

  async createAndRecommend(dto: CreateLeadDto) {
    const lead = this.leadRepo.create({
      fullName: dto.fullName,
      email: dto.email,
      destinationCountry: dto.destinationCountry ?? null,
      preferredCourse: dto.preferredCourse ?? null,
      startPeriod: dto.startPeriod ?? null,
      budgetRange: dto.budgetRange ?? null,
      source: 'hero_form',
    });
    await this.leadRepo.save(lead);

    // Recommend matching schools
    const qb = this.schoolRepo
      .createQueryBuilder('school')
      .leftJoinAndSelect('school.country', 'country')
      .leftJoinAndSelect('school.programs', 'program')
      .where('school.is_active = 1')
      .take(6);

    if (dto.destinationCountry) {
      qb.andWhere('country.name LIKE :c', {
        c: `%${dto.destinationCountry}%`,
      });
    }

    if (dto.preferredCourse) {
      qb.andWhere('program.course_name LIKE :p', {
        p: `%${dto.preferredCourse}%`,
      });
    }

    let schools = await qb.getMany();

    // Fallback: return top active schools if no course matches
    if (schools.length === 0) {
      schools = await this.schoolRepo.find({
        where: { isActive: true },
        relations: ['country', 'programs'],
        take: 6,
        order: { ranking: 'ASC' },
      });
    }

    return { lead: { id: lead.id }, schools };
  }

  async findAll() {
    return this.leadRepo.find({ order: { createdAt: 'DESC' } });
  }
}
