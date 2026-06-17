import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDocumentDto {
  @ApiPropertyOptional({
    description: 'Custom label for the document',
    example: 'Updated Portfolio',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customLabel?: string;

  @ApiPropertyOptional({
    description: 'Document expiry date (ISO 8601)',
    example: '2031-06-01',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}