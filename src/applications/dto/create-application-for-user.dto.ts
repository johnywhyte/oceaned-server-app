import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Admin creates an application on behalf of a prospective student. If no user
 * with the given email exists, a STUDENT account is created with a generated
 * password and the login credentials are emailed to them.
 */
export class CreateApplicationForUserDto {
  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Nigeria' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiProperty({ description: 'Program the application targets', example: 1 })
  @IsNumber()
  programId: number;

  @ApiPropertyOptional({ description: 'Optional scholarship', example: 1 })
  @IsOptional()
  @IsNumber()
  scholarshipId?: number;

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  intendedMajor?: string;

  @ApiPropertyOptional({ description: 'Internal note shown to reviewers' })
  @IsOptional()
  @IsString()
  reviewerNotes?: string;
}
