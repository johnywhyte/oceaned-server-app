import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program } from './entities/program.entity';
import { School } from '../schools/entities/school.entity';
import { DegreeType } from '../scholarship/entities/degree-type.entity';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,

    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,

    @InjectRepository(DegreeType)
    private readonly degreeTypeRepository: Repository<DegreeType>,
  ) {}

  // Private Helpers

  private async resolveSchool(schoolId: number): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) throw new BadRequestException('School was not found.');
    return school;
  }

  private async resolveDegreeType(degreeTypeId: number): Promise<DegreeType> {
    const degreeType = await this.degreeTypeRepository.findOne({
      where: { id: degreeTypeId },
    });
    if (!degreeType)
      throw new BadRequestException('Degree type was not found.');
    return degreeType;
  }

  private async findOneOrFail(id: number): Promise<Program> {
    const program = await this.programRepository.findOne({
      where: { id },
      relations: ['school', 'degreeType'],
    });
    if (!program) throw new NotFoundException('Program not found.');
    return program;
  }

  // Admin Operations

  async create(schoolId: number, dto: CreateProgramDto): Promise<Program> {
    const school = await this.resolveSchool(schoolId);
    const degreeType = await this.resolveDegreeType(dto.degreeTypeId);

    const program = this.programRepository.create({
      ...dto,
      school,
      degreeType,
    });

    return this.programRepository.save(program);
  }

  async findOne(id: number): Promise<Program> {
    return this.findOneOrFail(id);
  }

  async update(id: number, dto: UpdateProgramDto): Promise<Program> {
    const program = await this.findOneOrFail(id);

    if (dto.degreeTypeId) {
      program.degreeType = await this.resolveDegreeType(dto.degreeTypeId);
    }

    Object.assign(program, dto);

    return this.programRepository.save(program);
  }

  async remove(id: number): Promise<void> {
    const program = await this.findOneOrFail(id);
    await this.programRepository.remove(program);
  }

  // Activate / Deactivate

  async setActiveStatus(id: number, isActive: boolean): Promise<Program> {
    const program = await this.findOneOrFail(id);
    program.isActive = isActive;
    return this.programRepository.save(program);
  }
}
