import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsUrl,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartnerStatus } from '../entities/school.entity';

export class CreateSchoolDto {
  @ApiProperty({ description: 'School name', example: 'University of Toronto' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'School description',
    example: 'A leading public research university in Canada',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  logoUrl?: string;

  @ApiProperty({
    description: 'Country ID where the school is located',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  countryId: number;

  @ApiPropertyOptional({
    description: 'City where the school is located',
    example: 'Toronto',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'School website URL',
    example: 'https://www.utoronto.ca',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  websiteUrl?: string;

  @ApiPropertyOptional({ description: 'School ranking', example: 18 })
  @IsOptional()
  @IsInt()
  @Min(1)
  ranking?: number;

  @ApiPropertyOptional({
    description: 'Partner status',
    enum: PartnerStatus,
    default: PartnerStatus.NON_PARTNER,
  })
  @IsOptional()
  @IsEnum(PartnerStatus)
  partnerStatus?: PartnerStatus;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}
