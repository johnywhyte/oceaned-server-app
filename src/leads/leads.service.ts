import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { SchoolsService } from '../schools/schools.service';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    private readonly schoolsService: SchoolsService,
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

    // Use the shared recommendation engine so the hero form and the logged-in
    // dashboard surface the same set of schools for the same preferences.
    const schools = await this.schoolsService.recommend({
      country: dto.destinationCountry ?? undefined,
      course: dto.preferredCourse ?? undefined,
      limit: 6,
    });

    return { lead: { id: lead.id }, schools };
  }

  async findAll() {
    return this.leadRepo.find({ order: { createdAt: 'DESC' } });
  }
}
