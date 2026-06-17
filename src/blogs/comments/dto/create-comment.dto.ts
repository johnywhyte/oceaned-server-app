import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Content of the comment',
    maxLength: 2000,
    type: 'string',
    example: 'This is a comment on the post.',
  })
  @IsString()
  @MaxLength(2000)
  content: string;

  @ApiProperty({
    description: 'Optional parent comment ID for replies',
    required: false,
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  parent_id?: string;
}
