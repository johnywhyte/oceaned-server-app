import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsDecimal,
  MaxLength,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

class DocumentDto {
  @ApiProperty({ example: 'Transcript.pdf' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'academic_transcript' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'https://cdn.example.com/files/transcript.pdf' })
  @IsString()
  url: string;
}

class ReferenceDto {
  @ApiProperty({ example: 'Dr. John Smith' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'jsmith@university.edu' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'University of Lagos' })
  @IsString()
  institution: string;

  @ApiProperty({ example: 'Academic Supervisor' })
  @IsString()
  relationship: string;
}

export class CreateApplicationDto {
  @ApiProperty({ description: 'Scholarship ID to apply for', example: 1 })
  @IsNumber()
  scholarshipId: number;

  @ApiProperty({ description: 'Program ID to apply for', example: 1 })
  @IsNumber()
  programId: number;

  @ApiPropertyOptional({ description: 'Personal statement essay' })
  @IsOptional()
  @IsString()
  personalStatement?: string;

  @ApiPropertyOptional({ description: 'Current GPA (0.00 - 4.00)', example: 3.75 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4)
  currentGpa?: number;

  @ApiPropertyOptional({ description: 'Intended major/field of study', example: 'Computer Science' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  intendedMajor?: string;

  @ApiPropertyOptional({
    description: 'Supporting documents',
    type: [DocumentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  documents?: DocumentDto[];

  @ApiPropertyOptional({
    description: 'Reference contacts',
    type: [ReferenceDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceDto)
  references?: ReferenceDto[];

  @ApiPropertyOptional({
    description: 'Additional scholarship-specific answers',
    example: { 'Why do you deserve this scholarship?': 'Because...' },
  })
  @IsOptional()
  additionalAnswers?: Record<string, string>;
}