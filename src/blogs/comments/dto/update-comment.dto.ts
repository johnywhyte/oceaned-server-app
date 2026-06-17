import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCommentDto } from './create-comment.dto';

export class UpdateCommentDto extends PartialType(CreateCommentDto) {
  @ApiProperty({
    description: 'Updated content of the comment',
    maxLength: 2000,
    type: 'string',
    example: 'This is the updated comment content.',
  })
  content?: string;

  @ApiProperty({
    description:
      'Optional new parent comment ID for changing comment hierarchy',
    required: false,
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  parent_id?: string;
}
