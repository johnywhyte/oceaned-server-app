import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyCode } from '../../scholarship/entities/enums/scholarship.enums';

export class CreateProgramDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsInt()
  degreeTypeId: number;

  @ApiProperty({ example: 'Computer Science' })
  @IsString()
  @MaxLength(255)
  courseName: string;

  @ApiPropertyOptional({ example: '2 years' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  duration: string | null;

  @ApiPropertyOptional({ example: ['September', 'January'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  intakePeriods: string[] | null;

  @ApiPropertyOptional({ example: '2025-06-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  applicationDeadline: string | null;

  @ApiPropertyOptional({ example: 'IELTS 6.5 or equivalent' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  languageRequirements: string | null;

  @ApiPropertyOptional({ example: 15000.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tuitionFee: number | null;

  @ApiPropertyOptional({ enum: CurrencyCode, example: CurrencyCode.USD })
  @IsOptional()
  @IsEnum(CurrencyCode)
  currency: CurrencyCode | null;

  @ApiPropertyOptional({ example: ['Full upfront', 'Semester basis'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentPlanOptions: string[] | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}
