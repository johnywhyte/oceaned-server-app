import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SubmitApplicationDto {
  @ApiPropertyOptional({
    description: 'Final personal statement before submission. Overwrites any existing value.',
    example: 'I am applying for this scholarship because...',
  })
  @IsOptional()
  @IsString()
  personalStatement?: string;

  @ApiPropertyOptional({
    description: 'Any final additional answers to scholarship-specific questions.',
    example: { 'What are your career goals?': 'I intend to...' },
  })
  @IsOptional()
  additionalAnswers?: Record<string, string>;
}