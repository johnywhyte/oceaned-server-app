import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationStatus } from '../entities/applications.entity';

export class QueryApplicationDto {
  @ApiPropertyOptional({
    enum: ApplicationStatus,
    description: 'Filter by application status',
  })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Filter by scholarship ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  scholarshipId?: number;

  @ApiPropertyOptional({ description: 'Filter by program ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  programId?: number;

  @ApiPropertyOptional({ description: 'Filter by user ID (admin only)', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}