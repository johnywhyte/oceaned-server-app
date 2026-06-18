import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import {
  Application,
  ApplicationStatus,
  ProofOfFundsOption,
  UniversityType,
} from './entities/applications.entity';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { UserApplication, UserApplicationRole } from './entities/user-application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-status.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { SubmitApplicationDto } from './dto/submit-application.dto';
import { CreateApplicationForUserDto } from './dto/create-application-for-user.dto';
import { User } from '../user/entities/user.entity';
import { Role } from '../user/entities/role.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,

    @InjectRepository(UserApplication)
    private readonly userApplicationRepo: Repository<UserApplication>,

    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    private readonly emailService: EmailService,
  ) {}

  /** Generates a readable temporary password that satisfies the password policy. */
  private generatePassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const digits = '23456789';
    const all = upper + lower + digits;
    const pick = (set: string) => set[crypto.randomInt(set.length)];
    let pwd = pick(upper) + pick(lower) + pick(digits);
    for (let i = 0; i < 7; i++) pwd += pick(all);
    return pwd;
  }

  /**
   * Admin creates an application on behalf of a prospective student. If the
   * user doesn't exist, a STUDENT account is created with a generated password
   * and the credentials are emailed to them. The generated password is also
   * returned so the admin can share it directly.
   */
  async adminCreateForUser(dto: CreateApplicationForUserDto): Promise<{
    application: Application;
    user: { id: number; email: string; firstName: string; lastName: string };
    accountCreated: boolean;
    generatedPassword?: string;
  }> {
    let user = await this.userRepo.findOne({ where: { email: dto.email } });
    let generatedPassword: string | undefined;
    let accountCreated = false;

    if (!user) {
      const studentRole = await this.roleRepo.findOne({
        where: { name: 'STUDENT' },
      });
      if (!studentRole) {
        throw new BadRequestException('STUDENT role is not configured.');
      }
      generatedPassword = this.generatePassword();
      user = this.userRepo.create({
        email: dto.email,
        password: generatedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber ?? null,
        country: dto.country ?? null,
        role: studentRole,
      });
      user = await this.userRepo.save(user);
      accountCreated = true;
      await this.emailService.sendAccountCredentialsEmail(
        user.email,
        user.firstName,
        generatedPassword,
      );
    }

    const duplicate = await this.applicationRepo.findOne({
      where: {
        userId: user.id,
        programId: dto.programId,
        ...(dto.scholarshipId ? { scholarshipId: dto.scholarshipId } : {}),
      },
    });
    if (duplicate) {
      throw new ConflictException(
        'This user already has an application for that program.',
      );
    }

    const application = this.applicationRepo.create({
      userId: user.id,
      programId: dto.programId,
      scholarshipId: dto.scholarshipId ?? null,
      intendedMajor: dto.intendedMajor ?? null,
      reviewerNotes: dto.reviewerNotes ?? null,
      status: ApplicationStatus.DRAFT,
    });
    const saved = await this.applicationRepo.save(application);

    await this.userApplicationRepo.save(
      this.userApplicationRepo.create({
        userId: user.id,
        applicationId: saved.id,
        role: UserApplicationRole.STUDENT,
      }),
    );
    await this.recalculateCompletion(saved.id);

    return {
      application: await this.findOneOrFail(saved.id, true),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accountCreated,
      generatedPassword,
    };
  }

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
      scholarshipId: dto.scholarshipId ?? null,
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
      .leftJoinAndSelect('application.school', 'school')
      .leftJoinAndSelect('application.invoices', 'invoices')
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
      .leftJoinAndSelect('application.school', 'school')
      .leftJoinAndSelect('application.invoices', 'invoices')
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

  /* ----------------------------------------------------------------------- */
  /*  Study-abroad application flow (school → course → semester → documents) */
  /* ----------------------------------------------------------------------- */

  /** OCEANED application service fee (EUR). Configurable via env. */
  private serviceFee(): number {
    const v = Number(process.env.APPLICATION_SERVICE_FEE);
    return Number.isFinite(v) && v > 0 ? v : 350;
  }

  /** Create a DRAFT study-abroad application for the chosen school/course. */
  async createStudyApplication(
    userId: number,
    dto: {
      schoolId: number;
      intendedCourse: string;
      intake: string;
      degreeType?: string;
      universityType?: UniversityType;
      proofOfFundsOption?: ProofOfFundsOption;
      personalStatement?: string;
      documents?: { name: string; type: string; url: string }[];
    },
  ): Promise<Application> {
    const application = this.applicationRepo.create({
      userId,
      schoolId: dto.schoolId,
      intendedCourse: dto.intendedCourse,
      intake: dto.intake,
      degreeType: dto.degreeType ?? null,
      universityType: dto.universityType ?? null,
      proofOfFundsOption: dto.proofOfFundsOption ?? null,
      personalStatement: dto.personalStatement ?? null,
      documents: dto.documents
        ? dto.documents.map((d) => ({ ...d, uploadedAt: new Date() }))
        : null,
      status: ApplicationStatus.DRAFT,
    });
    const saved = await this.applicationRepo.save(application);
    await this.userApplicationRepo.save(
      this.userApplicationRepo.create({
        userId,
        applicationId: saved.id,
        role: UserApplicationRole.STUDENT,
      }),
    );
    return this.findOneOrFail(saved.id);
  }

  /** Append uploaded documents to an application the user owns. */
  async addDocuments(
    id: number,
    userId: number,
    docs: { name: string; type: string; url: string }[],
  ): Promise<Application> {
    await this.verifyOwnership(userId, id);
    const app = await this.findOneOrFail(id);
    const existing = Array.isArray(app.documents) ? app.documents : [];
    app.documents = [
      ...existing,
      ...docs.map((d) => ({ ...d, uploadedAt: new Date() })),
    ];
    return this.applicationRepo.save(app);
  }

  /** Remove a previously-uploaded document by its URL. */
  async removeDocument(id: number, userId: number, url: string): Promise<Application> {
    await this.verifyOwnership(userId, id);
    const app = await this.findOneOrFail(id);
    app.documents = (app.documents ?? []).filter((d) => d.url !== url);
    return this.applicationRepo.save(app);
  }

  /**
   * Submit a study application: moves DRAFT → PENDING_PAYMENT and raises an
   * invoice for the OCEANED application service fee.
   */
  async submitStudyApplication(
    id: number,
    userId: number,
    dto?: { proofOfFundsOption?: ProofOfFundsOption; personalStatement?: string },
  ): Promise<{ application: Application; invoice: Invoice }> {
    await this.verifyOwnership(userId, id);
    const app = await this.findOneOrFail(id);

    if (app.status !== ApplicationStatus.DRAFT) {
      throw new ConflictException('This application has already been submitted.');
    }
    if (!app.documents || app.documents.length === 0) {
      throw new BadRequestException(
        'Please upload your required documents before submitting.',
      );
    }
    if (dto?.proofOfFundsOption) app.proofOfFundsOption = dto.proofOfFundsOption;
    if (dto?.personalStatement) app.personalStatement = dto.personalStatement;

    app.status = ApplicationStatus.PENDING_PAYMENT;
    app.submittedAt = new Date();
    app.isComplete = true;
    app.completionPercentage = 100;
    await this.applicationRepo.save(app);

    // One open invoice per application.
    let invoice = await this.invoiceRepo.findOne({ where: { applicationId: id } });
    if (!invoice) {
      invoice = this.invoiceRepo.create({
        applicationId: id,
        userId,
        reference: `OCN-${id}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        description: 'OCEANED application & processing service fee',
        amount: this.serviceFee(),
        currency: 'EUR',
        status: InvoiceStatus.UNPAID,
      });
      invoice = await this.invoiceRepo.save(invoice);
    }

    return { application: await this.findOneOrFail(id), invoice };
  }

  /** Student uploads proof of payment → AWAITING_CONFIRMATION. */
  async uploadPaymentProof(
    id: number,
    userId: number,
    url: string,
  ): Promise<{ application: Application; invoice: Invoice }> {
    await this.verifyOwnership(userId, id);
    const app = await this.findOneOrFail(id);
    if (
      app.status !== ApplicationStatus.PENDING_PAYMENT &&
      app.status !== ApplicationStatus.AWAITING_CONFIRMATION
    ) {
      throw new ConflictException(
        'Payment proof can only be uploaded while payment is pending.',
      );
    }
    app.paymentProofUrl = url;
    app.status = ApplicationStatus.AWAITING_CONFIRMATION;
    await this.applicationRepo.save(app);

    const invoice = await this.invoiceRepo.findOne({ where: { applicationId: id } });
    if (invoice) {
      invoice.paymentProofUrl = url;
      invoice.status = InvoiceStatus.AWAITING_CONFIRMATION;
      await this.invoiceRepo.save(invoice);
    }
    return { application: await this.findOneOrFail(id), invoice: invoice! };
  }

  /** Admin confirms the payment → PROCESSING and marks the invoice paid. */
  async confirmPayment(id: number): Promise<Application> {
    const app = await this.findOneOrFail(id);
    if (app.status !== ApplicationStatus.AWAITING_CONFIRMATION) {
      throw new ConflictException(
        'Only applications awaiting payment confirmation can be confirmed.',
      );
    }
    app.status = ApplicationStatus.PROCESSING;
    await this.applicationRepo.save(app);

    const invoice = await this.invoiceRepo.findOne({ where: { applicationId: id } });
    if (invoice) {
      invoice.status = InvoiceStatus.PAID;
      invoice.paidAt = new Date();
      await this.invoiceRepo.save(invoice);
    }
    return this.findOneOrFail(id);
  }

  /** Admin advances the application through the processing lifecycle. */
  async setStudyStatus(
    id: number,
    status: ApplicationStatus,
    notes?: string,
    rejectionReason?: string,
  ): Promise<Application> {
    const app = await this.findOneOrFail(id);
    const allowed: ApplicationStatus[] = [
      ApplicationStatus.PROCESSING,
      ApplicationStatus.AWAITING_ADMISSION,
      ApplicationStatus.ADMISSION_GRANTED,
      ApplicationStatus.ADMISSION_REJECTED,
    ];
    if (!allowed.includes(status)) {
      throw new BadRequestException('Invalid status transition.');
    }
    if (status === ApplicationStatus.ADMISSION_REJECTED && !rejectionReason) {
      throw new BadRequestException('A reason is required when rejecting admission.');
    }
    app.status = status;
    if (notes) app.reviewerNotes = notes;
    if (status === ApplicationStatus.ADMISSION_REJECTED) {
      app.rejectionReason = rejectionReason!;
      app.decisionAt = new Date();
    }
    if (status === ApplicationStatus.ADMISSION_GRANTED) {
      app.decisionAt = new Date();
    }
    return this.applicationRepo.save(app);
  }

  /** Invoice for an application (owner or admin). */
  async getInvoice(applicationId: number): Promise<Invoice | null> {
    return this.invoiceRepo.findOne({ where: { applicationId } });
  }

  private async findOneOrFail(
    id: number,
    withRelations = false,
  ): Promise<Application> {
    const qb = this.applicationRepo
      .createQueryBuilder('app')
      .where('app.id = :id', { id })
      .andWhere('app.deleted_at IS NULL');

    qb.leftJoinAndSelect('app.school', 'school').leftJoinAndSelect(
      'app.invoices',
      'invoices',
    );

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