import {
  IsOptional,
  IsEnum,
  IsInt,
  IsString,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ScholarshipStatus,
  FundingType,
  CoverageType,
} from '../entities/enums/scholarship.enums';

export class FilterScholarshipDto {
  // Search
  @ApiPropertyOptional({
    example: 'engineering scholarship UK',
    description: 'Full-text search on title and description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  // Filters
  @ApiPropertyOptional({
    example: 1,
    description: 'Filter by eligible country ID',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  eligibleCountryId?: number;

  @ApiPropertyOptional({ example: 4, description: 'Filter by host country ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  hostCountryId?: number;

  @ApiPropertyOptional({ example: 2, description: 'Filter by degree type ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  degreeTypeId?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Filter by field of study ID',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  fieldOfStudyId?: number;

  @ApiPropertyOptional({
    enum: FundingType,
    example: FundingType.FULL,
    description: 'Filter by funding type',
  })
  @IsOptional()
  @IsEnum(FundingType)
  fundingType?: FundingType;

  @ApiPropertyOptional({
    enum: ScholarshipStatus,
    example: ScholarshipStatus.OPEN,
    description: 'Filter by scholarship status',
  })
  @IsOptional()
  @IsEnum(ScholarshipStatus)
  status?: ScholarshipStatus;

  @ApiPropertyOptional({
    enum: CoverageType,
    example: CoverageType.TUITION,
    description: 'Filter by coverage type',
  })
  @IsOptional()
  @IsEnum(CoverageType)
  coverageType?: CoverageType;

  @ApiPropertyOptional({
    example: '2025-12-31',
    description: 'Return scholarships with deadline on or before this date',
  })
  @IsOptional()
  @IsDateString()
  deadlineBefore?: string;

  // Pagination
  @ApiPropertyOptional({ example: 1, description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of results per page (max 100)',
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
