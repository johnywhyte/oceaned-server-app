import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus, DocumentType } from './entities/document.entity';
import { UserDocument, UserDocumentAccess } from './entities/user-document.entity';
import { UploadDocumentDto } from './dto/upload-documents.dto';
import { UpdateDocumentDto } from './dto/update-documents.dto';
import { ReviewDocumentDto } from './dto/review-documents.dto';
import { QueryDocumentDto } from './dto/query-documents.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service'; 

const ALLOWED_MIME_TYPES: string[] = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; 

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,

    @InjectRepository(UserDocument)
    private readonly userDocumentRepo: Repository<UserDocument>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}


  async upload(
    userId: number,
    dto: UploadDocumentDto,
    file: Express.Multer.File,
  ): Promise<Document> {
    this.validateFile(file);

    if (dto.documentType === DocumentType.OTHER && !dto.customLabel) {
      throw new BadRequestException(
        'A custom label is required when document type is OTHER.',
      );
    }

    if (dto.documentType !== DocumentType.OTHER) {
      const existing = await this.documentRepo.findOne({
        where: { userId, documentType: dto.documentType, deletedAt: null as any },
      });

      if (existing) {
        throw new ConflictException(
          `You already have a "${dto.documentType}" document. Use the replace endpoint to update it.`,
        );
      }
    }

    const uploadResult = await this.cloudinaryService.uploadImage(file, 'user_documents');

    const document = this.documentRepo.create({
      userId,
      documentType: dto.documentType,
      customLabel: dto.customLabel ?? null,
      fileName: file.originalname,
      originalName: file.originalname,
      fileUrl: uploadResult.url, 
      fileKey: uploadResult.publicId, 
      mimeType: file.mimetype,
      fileSize: file.size,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      status: DocumentStatus.PENDING,
      isVerified: false,
    });

    const saved = await this.documentRepo.save(document);
    const pivot = this.userDocumentRepo.create({
      userId,
      documentId: saved.id,
      access: UserDocumentAccess.OWNER,
    });
    await this.userDocumentRepo.save(pivot);

    return this.findOneOrFail(saved.id);
  }


  async replace(
    id: number,
    userId: number,
    file: Express.Multer.File,
  ): Promise<Document> {
    this.validateFile(file);

    const document = await this.findOneOrFail(id);
    await this.verifyOwnership(userId, id);
    if (document.fileKey) {
      await this.cloudinaryService.deleteImage(document.fileKey);
    }

    const uploadResult = await this.cloudinaryService.uploadImage(file, 'user_documents');

    // 3. Update existing record metadata
    document.fileName = file.originalname;
    document.originalName = file.originalname;
    document.fileUrl = uploadResult.url;
    document.fileKey = uploadResult.publicId;
    document.mimeType = file.mimetype;
    document.fileSize = file.size;
    document.status = DocumentStatus.PENDING;
    document.isVerified = false;
    document.adminRemarks = null;
    document.reviewedBy = null;
    document.reviewedAt = null;

    return this.documentRepo.save(document);
  }

  async findMyDocuments(
    userId: number,
    query: QueryDocumentDto,
  ): Promise<{ data: Document[]; total: number; page: number; limit: number }> {
    const { documentType, status, page = 1, limit = 10 } = query;

    const qb = this.documentRepo
      .createQueryBuilder('document')
      .where('document.userId = :userId', { userId })
      .andWhere('document.deletedAt IS NULL');

    if (documentType) qb.andWhere('document.documentType = :documentType', { documentType });
    if (status) qb.andWhere('document.status = :status', { status });

    const [data, total] = await qb
      .orderBy('document.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findMyDocument(id: number, userId: number): Promise<Document> {
    const document = await this.findOneOrFail(id);
    await this.verifyOwnership(userId, id);
    return document;
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateDocumentDto,
  ): Promise<Document> {
    const document = await this.findOneOrFail(id);
    await this.verifyOwnership(userId, id);

    if (document.status === DocumentStatus.APPROVED) {
      throw new ForbiddenException(
        'Approved documents cannot be edited. Please contact support.',
      );
    }

    if (dto.customLabel !== undefined) document.customLabel = dto.customLabel;
    if (dto.expiryDate !== undefined) {
      document.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    }

    return this.documentRepo.save(document);
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    const document = await this.findOneOrFail(id);
    await this.verifyOwnership(userId, id);

    if (document.status === DocumentStatus.APPROVED) {
      throw new ForbiddenException(
        'Approved documents cannot be deleted.',
      );
    }

    await this.documentRepo.softDelete(id);
    return { message: `Document #${id} deleted successfully.` };
  }


  async findAll(
    query: QueryDocumentDto,
  ): Promise<{ data: Document[]; total: number; page: number; limit: number }> {
    const { documentType, status, userId, page = 1, limit = 10 } = query;

    const qb = this.documentRepo
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.user', 'user')
      .where('document.deletedAt IS NULL');

    if (documentType) qb.andWhere('document.documentType = :documentType', { documentType });
    if (status) qb.andWhere('document.status = :status', { status });
    if (userId) qb.andWhere('document.userId = :userId', { userId });

    const [data, total] = await qb
      .orderBy('document.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async review(
    id: number,
    dto: ReviewDocumentDto,
    adminId: number,
  ): Promise<Document> {
    const document = await this.findOneOrFail(id);

    if (dto.status === DocumentStatus.REJECTED && !dto.adminRemarks) {
      throw new BadRequestException('Admin remarks are required for rejection.');
    }

    document.status = dto.status;
    document.adminRemarks = dto.adminRemarks ?? null;
    document.reviewedBy = adminId;
    document.reviewedAt = new Date();
    document.isVerified = dto.status === DocumentStatus.APPROVED;

    return this.documentRepo.save(document);
  }

  async findOneAdmin(id: number): Promise<Document> {
  return this.findOneOrFail(id, true);
}

async adminRemove(id: number): Promise<{ message: string }> {
  await this.findOneOrFail(id);
  await this.documentRepo.softDelete(id);
  
  return { message: `Document #${id} has been soft-deleted by admin.` };
}

  private async findOneOrFail(id: number, withRelations = false): Promise<Document> {
    const qb = this.documentRepo
      .createQueryBuilder('doc')
      .where('doc.id = :id', { id })
      .andWhere('doc.deletedAt IS NULL');

    if (withRelations) {
      qb.leftJoinAndSelect('doc.user', 'user');
    }

    const document = await qb.getOne();
    if (!document) throw new NotFoundException(`Document #${id} not found.`);
    return document;
  }

  private async verifyOwnership(userId: number, documentId: number): Promise<void> {
    const pivot = await this.userDocumentRepo.findOne({
      where: { userId, documentId, access: UserDocumentAccess.OWNER },
    });
    if (!pivot) throw new ForbiddenException('Access denied.');
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) throw new BadRequestException('No file uploaded.');
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}`);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds 10MB limit.');
    }
  }

  async getUserDocumentPivots(documentId: number): Promise<UserDocument[]> {
    await this.findOneOrFail(documentId);
    
    return this.userDocumentRepo.find({
      where: { documentId },
      relations: ['user'], 
    });
  }
}