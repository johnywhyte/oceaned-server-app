import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class ReportCommentDto {
  @ApiProperty({
    description: 'Reason for reporting the comment',
    example: 'This comment contains inappropriate content.',
  })
  @IsString()
  reason: string;
}
