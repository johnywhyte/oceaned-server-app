import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsUrl,
  IsDateString,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ScholarshipStatus,
  FundingType,
  ScholarshipSource,
  CoverageType,
  CurrencyCode,
} from '../entities/enums/scholarship.enums';

export class CreateScholarshipDto {
  @ApiProperty({ example: 'Chevening Scholarship 2025' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'The Chevening Scholarship is a UK government scholarship...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Open to graduates with at least 2 years of work experience...',
  })
  @IsOptional()
  @IsString()
  eligibility?: string;

  @ApiPropertyOptional({ enum: FundingType, example: FundingType.FULL })
  @IsOptional()
  @IsEnum(FundingType)
  fundingType?: FundingType;

  @ApiPropertyOptional({
    enum: CoverageType,
    isArray: true,
    example: [CoverageType.TUITION, CoverageType.LIVING],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CoverageType, { each: true })
  coverage?: CoverageType[];

  @ApiPropertyOptional({ example: 'https://www.chevening.org/apply' })
  @IsOptional()
  @IsUrl()
  applicationUrl?: string;

  @ApiPropertyOptional({
    enum: ScholarshipStatus,
    example: ScholarshipStatus.UPCOMING,
  })
  @IsOptional()
  @IsEnum(ScholarshipStatus)
  status?: ScholarshipStatus;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Full scholarship value',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    example: 30000,
    description: 'Discounted amount if applicable',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountedAmount?: number;

  @ApiPropertyOptional({ enum: CurrencyCode, example: CurrencyCode.USD })
  @IsOptional()
  @IsEnum(CurrencyCode)
  currency?: CurrencyCode;

  @ApiPropertyOptional({
    enum: ScholarshipSource,
    example: ScholarshipSource.ADMIN,
  })
  @IsOptional()
  @IsEnum(ScholarshipSource)
  source?: ScholarshipSource;

  @ApiPropertyOptional({ example: 'https://www.chevening.org' })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @ApiPropertyOptional({ example: '2025-11-01' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 2, 3],
    description: 'IDs of eligible countries',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  eligibleCountryIds?: number[];

  @ApiPropertyOptional({
    type: [Number],
    example: [4],
    description: 'IDs of host countries',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  hostCountryIds?: number[];

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 2],
    description: 'IDs of degree types',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  degreeTypeIds?: number[];

  @ApiPropertyOptional({
    type: [Number],
    example: [3, 7],
    description: 'IDs of fields of study',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  fieldOfStudyIds?: number[];

  @ApiPropertyOptional({
    type: [Number],
    example: [10, 11],
    description: 'IDs of linked programs',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  programIds?: number[];
}
