import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZE,
} from '../common/constants';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Generic image upload service used by the blog (featured images, inline
 * editor images) and any other module that needs a hosted image URL.
 *
 * When `USE_LOCAL_UPLOADS=true` (or Cloudinary is not configured with real
 * credentials) files are written to the local `uploads/` directory and served
 * statically from `/uploads`. This lets the whole flow work locally without a
 * Cloudinary account. In production, set real Cloudinary credentials and
 * `USE_LOCAL_UPLOADS=false` to use Cloudinary.
 */
@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor(
    private readonly configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private useLocal(): boolean {
    const flag = this.configService.get<string>('USE_LOCAL_UPLOADS');
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    // Use local storage when explicitly requested or when Cloudinary is still
    // on the placeholder credentials shipped for local development.
    return flag === 'true' || flag === '1' || cloudName === 'local-dev';
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'blog',
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    if (this.useLocal()) {
      return this.saveLocally(file, folder);
    }
    return this.cloudinaryService.uploadImage(file, `oceaned/${folder}`);
  }

  private async saveLocally(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    const dir = join(this.uploadDir, folder);
    await fs.mkdir(dir, { recursive: true });

    const ext = extname(file.originalname) || this.extFromMime(file.mimetype);
    const filename = `${randomUUID()}${ext}`;
    await fs.writeFile(join(dir, filename), file.buffer);

    const baseUrl =
      this.configService.get<string>('PUBLIC_API_URL') ||
      `http://localhost:${this.configService.get<string>('PORT') || '8002'}`;

    const publicId = `${folder}/${filename}`;
    const url = `${baseUrl}/uploads/${publicId}`;
    this.logger.log(`Stored upload locally at ${url}`);
    return { url, publicId };
  }

  /** Upload an application document (PDF / Word / image). */
  async uploadDocument(
    file: Express.Multer.File,
    folder = 'documents',
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: PDF, Word, JPG, PNG.`,
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`,
      );
    }
    if (this.useLocal()) {
      return this.saveLocally(file, folder);
    }
    return this.cloudinaryService.uploadImage(file, `oceaned/${folder}`);
  }

  async deleteImage(publicId: string): Promise<void> {
    if (this.useLocal()) {
      try {
        await fs.unlink(join(this.uploadDir, publicId));
      } catch (err) {
        this.logger.warn(`Could not delete local upload ${publicId}`);
      }
      return;
    }
    await this.cloudinaryService.deleteImage(publicId);
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'application/pdf': '.pdf',
    };
    return map[mime] || '';
  }
}
