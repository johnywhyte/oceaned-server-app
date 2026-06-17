import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-documents.dto';
import { UpdateDocumentDto } from './dto/update-documents.dto';
import { ReviewDocumentDto } from './dto/review-documents.dto';
import { QueryDocumentDto } from './dto/query-documents.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { memoryStorage } from 'multer';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}


  @Post('upload')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file',{ storage: memoryStorage() })) 
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a new document',
    description: 'Uploads a file to Cloudinary. Allowed types: PDF, JPEG, PNG, DOC, DOCX. Max size: 10MB.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'documentType'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Document file' },
        documentType: {
          type: 'string',
          enum: [
            'passport', 'academic_transcript', 'cv',
            'statement_of_purpose', 'recommendation_letter',
            'birth_certificate', 'language_certificate',
            'financial_statement', 'other',
          ],
        },
        customLabel: { type: 'string' },
        expiryDate: { type: 'string', format: 'date' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully.' })
  upload(
    @Request() req,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.upload(req.user.id, dto, file);
  }

  @Patch(':id/replace')
  @Roles(UserRole.STUDENT)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file',{ storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Replace an existing document file' })
  @ApiParam({ name: 'id', type: Number })
  replace(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.replace(id, req.user.id, file);
  }

  @Get('my')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my documents' })
  findMyDocuments(@Request() req, @Query() query: QueryDocumentDto) {
    return this.documentsService.findMyDocuments(req.user.id, query);
  }

  @Get('my/:id')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get a single document (student)' })
  findMyDocument(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.documentsService.findMyDocument(id, req.user.id);
  }

  @Patch('my/:id')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Update document metadata' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, req.user.id, dto);
  }

  @Delete('my/:id')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a document (student)' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.documentsService.remove(id, req.user.id);
  }

  @Get('admin')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.APPLICATION_MANAGER)
  @ApiOperation({ summary: '[Admin] Get all documents' })
  findAll(@Query() query: QueryDocumentDto) {
    return this.documentsService.findAll(query);
  }

  @Get('admin/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.APPLICATION_MANAGER)
  @ApiOperation({ summary: '[Admin] Get a single document' })
  findOneAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.findOneAdmin(id);
  }

  @Patch('admin/:id/review')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.APPLICATION_MANAGER)
  @ApiOperation({ summary: '[Admin] Review a document' })
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewDocumentDto,
    @Request() req,
  ) {
    return this.documentsService.review(id, dto, req.user.id);
  }

  @Delete('admin/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Soft-delete a document' })
  adminRemove(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.adminRemove(id);
  }

  @Get('admin/:id/users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.APPLICATION_MANAGER)
  @ApiOperation({ summary: '[Admin] Get user_documents pivot records' })
  getUserDocumentPivots(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.getUserDocumentPivots(id);
  }
}