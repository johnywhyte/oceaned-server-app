import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/enums/role.enum';
import { UserRole } from '../blogs/enums/blog.enums';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Upload an image (featured image / inline editor image)',
    description:
      'Uploads an image and returns its public URL. Used by the blog editor. ' +
      'Stores locally in development, Cloudinary in production.',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded under field "file"');
    }
    const result = await this.uploadsService.uploadImage(file, folder || 'blog');
    return {
      success: true,
      message: 'Image uploaded successfully',
      data: result,
    };
  }

  @Post('document')
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Upload an application document (PDF, Word or image)',
    description:
      'Authenticated students upload their application/payment documents. ' +
      'Returns the hosted file URL.',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded under field "file"');
    }
    const result = await this.uploadsService.uploadDocument(
      file,
      folder || 'documents',
    );
    return {
      success: true,
      message: 'Document uploaded successfully',
      data: result,
    };
  }
}
