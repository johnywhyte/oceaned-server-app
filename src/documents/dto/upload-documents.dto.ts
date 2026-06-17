import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { DocumentType } from '../entities/document.entity';

export class UploadDocumentDto {
  @ApiProperty({
    enum: DocumentType,
    description: 'Type of document being uploaded',
    example: DocumentType.PASSPORT,
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiPropertyOptional({
    description: 'Custom label — required when documentType is OTHER',
    example: 'Portfolio',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customLabel?: string;

  @ApiPropertyOptional({
    description: 'Document expiry date (ISO 8601)',
    example: '2030-01-01',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}