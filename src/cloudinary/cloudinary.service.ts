import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '../common/constants';

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'oceaned',
  ): Promise<{ url: string; publicId: string }> {
    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: 'auto',
            transformation: [
              { width: 800, height: 800, crop: 'limit' },
              { quality: 'auto', fetch_format: 'auto' },
            ],
          },
          (error, result: UploadApiResponse) => {
            if (error) {
              reject(
                new BadRequestException(
                  `Failed to upload image: ${error.message}`,
                ),
              );
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
              });
            }
          },
        )
        .end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      const result = (await cloudinary.uploader.destroy(publicId)) as {
        result: string;
      };
      if (result.result !== 'ok') {
        throw new BadRequestException(
          `Failed to delete image: ${result.result} with public ID: ${publicId}`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Failed to delete image: ${(error as Error).message}`,
      );
    }
  }
}
