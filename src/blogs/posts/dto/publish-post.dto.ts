import { IsOptional, IsDateString, IsEnum, IsDate } from 'class-validator';
import { PostStatus } from '../../enums/blog.enums';
import { Type } from 'class-transformer';

export class PublishPostDto {
  @IsEnum(PostStatus)
  status: PostStatus;

  @IsOptional()
  @Type(() => Date) // This handles the conversion
  @IsDate() // This validates the resulting object
  scheduled_at?: Date;
}
