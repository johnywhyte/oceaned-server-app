import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '../entities/applications.entity';

export class UpdateApplicationStatusDto {
  @ApiProperty({
    enum: ApplicationStatus,
    description: 'New application status',
    example: ApplicationStatus.UNDER_REVIEW,
  })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'Internal reviewer notes (admin only)',
    example: 'Strong candidate, proceed to shortlist.',
  })
  @IsOptional()
  @IsString()
  reviewerNotes?: string;

  @ApiPropertyOptional({
    description: 'Reason for rejection (required when status is REJECTED)',
    example: 'Does not meet minimum GPA requirement.',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}