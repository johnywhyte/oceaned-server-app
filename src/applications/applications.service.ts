import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './entities/applications.entity';
import { UserApplication, UserApplicationRole } from './entities/user-application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-status.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { SubmitApplicationDto } from './dto/submit-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,

    @InjectRepository(UserApplication)
    private readonly userApplicationRepo: Repository<UserApplication>,
  ) {}

  async create(userId: number, dto: CreateApplicationDto): Promise<Application> {
    const existing = await this.applicationRepo.findOne({
      where: {
        userId,
        scholarshipId: dto.scholarshipId,
        programId: dto.programId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'You have already applied for this scholarship and program.',
      );
    }

    const application = this.applicationRepo.create({
      userId,
      scholarshipId: dto.scholarshipId,
      programId: dto.programId,
      personalStatement: dto.personalStatement ?? null,
      currentGpa: dto.currentGpa ?? null,
      intendedMajor: dto.intendedMajor ?? null,
      documents: dto.documents
        ? dto.documents.map((d) => ({ ...d, uploadedAt: new Date() }))
        : null,
      references: dto.references ?? null,
      additionalAnswers: dto.additionalAnswers ?? null,
      status: ApplicationStatus.DRAFT,
    });

    const saved = await this.applicationRepo.save(application);
    const pivot = this.userApplicationRepo.create({
      userId,
      applicationId: saved.id,
      role: UserApplicationRole.STUDENT,
    });
    await this.userApplicationRepo.save(pivot);
    await this.recalculateCompletion(saved.id);
    return this.findOneOrFail(saved.id);
  }

 
  async findMyApplications(
    userId: number,
    query: QueryApplicationDto,
  ): Promise<{ data: Application[]; total: number; page: number; limit: number }> {
    const { status, scholarshipId, programId, page = 1, limit = 10 } = query;

    const qb = this.applicationRepo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.scholarship', 'scholarship')
      .leftJoinAndSelect('application.program', 'program')
      .where('application.userId = :userId', { userId })
      .andWhere('application.deleted_at IS NULL');

    if (status) qb.andWhere('application.status = :status', { status });
    if (scholarshipId) qb.andWhere('application.scholarshipId = :scholarshipId', { scholarshipId });
    if (programId) qb.andWhere('application.programId = :programId', { programId });

    const [data, total] = await qb
      .orderBy('application.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: number, userId: number): Promise<Application> {
    const application = await this.findOneOrFail(id);
    await this.verifyOwnership(userId, id);
    return application;
  }

 

  async findAll(
    query: QueryApplicationDto,
  ): Promise<{ data: Application[]; total: number; page: number; limit: number }> {
    const { status, scholarshipId, programId, userId, page = 1, limit = 10 } = query;

    const qb = this.applicationRepo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.user', 'user')
      .leftJoinAndSelect('application.scholarship', 'scholarship')
      .leftJoinAndSelect('application.program', 'program')
      .leftJoinAndSelect('application.userApplications', 'userApplications')
      .where('application.deletedAt IS NULL');

    if (status) qb.andWhere('application.status = :status', { status });
    if (scholarshipId) qb.andWhere('application.scholarshipId = :scholarshipId', { scholarshipId });
    if (programId) qb.andWhere('application.programId = :programId', { programId });
    if (userId) qb.andWhere('application.userId = :userId', { userId });

    const [data, total] = await qb
      .orderBy('application.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOneAdmin(id: number): Promise<Application> {
    return this.findOneOrFail(id, true);
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateApplicationDto,
  ): Promise<Application> {
    const application = await this.findOneOrFail(id);
    await this.verifyOwnership(userId, id);

    if (application.status !== ApplicationStatus.DRAFT) {
      throw new ForbiddenException(
        'Only DRAFT applications can be edited.',
      );
    }

    if (dto.documents) {
      dto.documents = dto.documents.map((d) => ({
        ...d,
        uploadedAt: new Date(),
      })) as any;
    }

    Object.assign(application, dto);
    const saved = await this.applicationRepo.save(application);
    await this.recalculateCompletion(saved.id);

    return this.findOneOrFail(saved.id);
  }


  async submit(
    id: number,
    userId: number,
    dto: SubmitApplicationDto,
  ): Promise<Application> {
    const application = await this.findOneOrFail(id);
    await this.verifyOwnership(userId, id);

    if (application.status !== ApplicationStatus.DRAFT) {
      throw new ConflictException('Only DRAFT applications can be submitted.');
    }

    if (dto.personalStatement) {
      application.personalStatement = dto.personalStatement;
    }
    if (dto.additionalAnswers) {
      application.additionalAnswers = dto.additionalAnswers;
    }

    await this.applicationRepo.save(application);
    await this.recalculateCompletion(id);

    // Re-fetch after recalculation to get updated completionPercentage
    const refreshed = await this.findOneOrFail(id);

    if (!refreshed.isComplete) {
      throw new BadRequestException(
        `Application is only ${refreshed.completionPercentage}% complete. Please fill all required fields before submitting.`,
      );
    }

    refreshed.status = ApplicationStatus.SUBMITTED;
    refreshed.submittedAt = new Date();

    return this.applicationRepo.save(refreshed);
  }


  async withdraw(id: number, userId: number): Promise<Application> {
    const application = await this.findOneOrFail(id);
    await this.verifyOwnership(userId, id);

    const withdrawableStatuses: ApplicationStatus[] = [
      ApplicationStatus.DRAFT,
      ApplicationStatus.SUBMITTED,
      ApplicationStatus.UNDER_REVIEW,
    ];

    if (!withdrawableStatuses.includes(application.status)) {
      throw new ConflictException(
        `Cannot withdraw an application with status "${application.status}".`,
      );
    }

    application.status = ApplicationStatus.WITHDRAWN;
    return this.applicationRepo.save(application);
  }

 
  async updateStatus(
    id: number,
    dto: UpdateApplicationStatusDto,
    adminId: number,
  ): Promise<Application> {
    const application = await this.findOneOrFail(id);

    if (
      dto.status === ApplicationStatus.REJECTED &&
      !dto.rejectionReason
    ) {
      throw new BadRequestException(
        'A rejection reason is required when rejecting an application.',
      );
    }

    application.status = dto.status;
    application.reviewedAt = new Date();

    if (dto.reviewerNotes) application.reviewerNotes = dto.reviewerNotes;

    if (dto.status === ApplicationStatus.REJECTED) {
      application.rejectionReason = dto.rejectionReason!;
      application.decisionAt = new Date();
    }

    if (dto.status === ApplicationStatus.ACCEPTED) {
      application.decisionAt = new Date();
    }

    return this.applicationRepo.save(application);
  }


  async remove(id: number): Promise<{ message: string }> {
    const application = await this.findOneOrFail(id);
    await this.applicationRepo.softDelete(id);
    return { message: `Application #${id} deleted successfully.` };
  }

  async getUserApplicationPivots(applicationId: number): Promise<UserApplication[]> {
    await this.findOneOrFail(applicationId); 
    return this.userApplicationRepo.find({
      where: { applicationId },
      relations: ['user'],
    });
  }

  private async findOneOrFail(
    id: number,
    withRelations = false,
  ): Promise<Application> {
    const qb = this.applicationRepo
      .createQueryBuilder('app')
      .where('app.id = :id', { id })
      .andWhere('app.deleted_at IS NULL');

    if (withRelations) {
      qb.leftJoinAndSelect('app.user', 'user')
        .leftJoinAndSelect('app.scholarship', 'scholarship')
        .leftJoinAndSelect('app.program', 'program')
        .leftJoinAndSelect('app.userApplications', 'userApplications');
    }

    const application = await qb.getOne();

    if (!application) {
      throw new NotFoundException(`Application with id ${id} not found.`);
    }

    return application;
  }

  private async verifyOwnership(
    userId: number,
    applicationId: number,
  ): Promise<void> {
    const pivot = await this.userApplicationRepo.findOne({
      where: { userId, applicationId },
    });

    if (!pivot) {
      throw new ForbiddenException(
        'You do not have access to this application.',
      );
    }
  }

  
  private async recalculateCompletion(id: number): Promise<void> {
    const app = await this.applicationRepo.findOne({ where: { id } });
    if (!app) return;

    const checks = [
      !!app.personalStatement,
      app.currentGpa !== null,
      !!app.intendedMajor,
      Array.isArray(app.documents) && app.documents.length > 0,
      Array.isArray(app.references) && app.references.length > 0,
    ];

    const filled = checks.filter(Boolean).length;
    const percentage = Math.round((filled / checks.length) * 100);

    await this.applicationRepo.update(id, {
      completionPercentage: percentage,
      isComplete: percentage === 100,
    });
  }
}