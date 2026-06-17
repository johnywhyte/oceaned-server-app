import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DocumentStatus } from '../entities/document.entity';

export class ReviewDocumentDto {
  @ApiProperty({
    enum: DocumentStatus,
    description: 'Review decision for the document',
    example: DocumentStatus.APPROVED,
  })
  @IsEnum(DocumentStatus)
  status: DocumentStatus;

  @ApiPropertyOptional({
    description: 'Admin remarks on the document — required when status is REJECTED',
    example: 'Document is blurry and unreadable. Please re-upload a clearer copy.',
  })
  @IsOptional()
  @IsString()
  adminRemarks?: string;
}