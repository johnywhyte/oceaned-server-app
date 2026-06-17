import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsInt,
  IsDateString,
  IsUrl,
  MaxLength,
} from 'class-validator';

import { PostStatus } from '../../enums/blog.enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: 'Title of the blog post',
    example: 'How to Build a REST API with NestJS',
    required: true,
  })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Slug for the blog post',
    example: 'how-to-build-a-rest-api-with-nestjs',
    required: false,
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    description: 'Content of the blog post',
    example: 'This is the content of the blog post.',
    required: true,
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'ID of the author',
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsInt()
  author_id?: number;

  @ApiProperty({
    description: 'URL of the featured image',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  featured_image_url?: string;

  @ApiProperty({
    description: 'Status of the blog post',
    example: 'DRAFT',
    required: false,
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiProperty({
    description: 'Scheduled date for the blog post',
    example: '2023-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduled_at?: Date;

  @ApiProperty({
    description: 'Indicates if the blog post is featured',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @ApiProperty({
    description: 'SEO meta title for the blog post',
    example: 'Learn how to build a REST API with NestJS',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  seo_meta_title?: string;

  @ApiProperty({
    description: 'SEO meta description for the blog post',
    example: 'A comprehensive guide to building a REST API with NestJS',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  seo_meta_description?: string;

  @ApiProperty({
    description: 'IDs of the categories for the blog post',
    example: [1, 2],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  category_ids?: number[];

  @ApiProperty({
    description: 'IDs of the tags for the blog post',
    example: [1, 2, 3],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tag_ids?: number[];
}
