import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { PartnerStatus, SchoolType } from '../entities/school.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FilterSchoolDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by school name',
    example: 'Toronto',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  countryId?: number;

  @ApiPropertyOptional({ example: 'Toronto' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State / region', example: 'Bavaria' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Filter by school type',
    enum: SchoolType,
  })
  @IsOptional()
  @IsEnum(SchoolType)
  schoolType?: SchoolType;

  @ApiPropertyOptional({
    description: 'Filter by partner status',
    enum: PartnerStatus,
  })
  @IsOptional()
  @IsEnum(PartnerStatus)
  partnerStatus?: PartnerStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;
}
