import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'The name of the category',
    example: 'Technology',
    maxLength: 120,
  })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({
    description: 'The slug of the category',
    example: 'technology',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  slug?: string;

  @ApiProperty({
    description: 'The description of the category',
    example: 'A category for technology-related posts',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'The SEO meta title for the category',
    example: 'Technology Category - Latest Tech News and Articles',
    maxLength: 160,
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  seo_meta_title?: string;

  @ApiProperty({
    description: 'The SEO meta description for the category',
    example:
      'Explore the latest news, articles, and insights in the technology world with our Technology category.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  seo_meta_description?: string;

  @ApiProperty({
    description: 'Indicates whether the category is enabled or not',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}
