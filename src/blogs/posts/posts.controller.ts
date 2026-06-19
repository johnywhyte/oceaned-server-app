import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { PublishPostDto } from './dto/publish-post.dto';
import { PostsAnalyticsService } from './posts-analytics.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/enums/role.enum';
import { UserRole } from '../enums/blog.enums';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Posts') // Swagger tag for grouping
@Controller('posts')
@UseGuards(JwtAuthGuard, RolesGuard) // Protect with JWT and role-based guard
@ApiBearerAuth('JWT-auth')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly analyticsService: PostsAnalyticsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN) // Only allow ADMIN and SUPER_ADMIN roles
  // @UseGuards(JwtAuthGuard, RolesGuard) // Ensure guards are applied
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Rate limit: 10 requests per minute
  @ApiOperation({
    summary: 'Create a new post',
    description:
      'Creates a new blog post with the provided details (Admin only).',
  }) // Swagger operation summary
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: CreatePostDto,
  }) // Swagger response
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient role' }) // Swagger response for forbidden access
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  }) // Swagger response for unauthorized access
  async create(
    @Body() dto: CreatePostDto,
    @CurrentUser('id') authorId: number,
  ) {
    return this.postsService.create(dto, authorId);
  }

  // GET /posts?status=PUBLISHED&author_id=1&category_slug=technology&tag_slug=nestjs&search=JavaScript&page=1&limit=10&sort=latest
  @Public() // Allow public access to this endpoint
  @Get()
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // Rate limit: 30 requests per minute
  @ApiOperation({
    summary: 'List all posts (paginated, filterable)',
    description:
      'Retrieve a list of all blog posts with pagination and filtering options.',
  }) // Swagger operation summary
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'PUBLISHED', 'SCHEDULED'],
  }) // Swagger query parameter for status
  @ApiQuery({ name: 'author_id', required: false, example: 1 }) // Swagger query parameter for author_id
  @ApiQuery({ name: 'category_slug', required: false, example: 'technology' }) // Swagger query parameter for category_slug
  @ApiQuery({ name: 'tag_slug', required: false, example: 'nestjs' }) // Swagger query parameter for tag_slug
  @ApiQuery({ name: 'search', required: false, example: 'JavaScript' }) // Swagger query parameter for search
  @ApiQuery({ name: 'page', required: false, example: 1 }) // Swagger query parameter for page
  @ApiQuery({ name: 'limit', required: false, example: 10 }) // Swagger query parameter for limit
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['latest', 'popular', 'oldest'],
    example: 'latest',
  }) // Swagger query parameter for sort
  @ApiResponse({
    status: 200,
    description: 'Posts retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Success',
        data: [],
      },
    },
  }) // Swagger response
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid query parameters',
  }) // Swagger response for bad request
  async findAll(@Query() query: PostQueryDto) {
    return this.postsService.findAllPosts(query);
  }

  // GET /posts/:idOrSlug
  @Public() // Allow public access to this endpoint
  @Get(':idOrSlug')
  @ApiOperation({
    summary: 'Retrieve a specific post by ID or slug',
    description:
      'Get the details of a specific post using either its unique ID or slug.',
  }) // Swagger operation summary
  @ApiParam({
    name: 'idOrSlug',
    description: 'The unique ID or slug of the post',
    example: '123e4567-e89b-12d3-a456-426614174000 or my-first-post',
  }) // Swagger path parameter for idOrSlug
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Post retrieved successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'My First Post',
          slug: 'my-first-post',
          content: 'This is the content of the post.',
          author_id: 1,
          featured_image_url: 'https://example.com/image.jpg',
          status: 'PUBLISHED',
          scheduled_at: null,
          is_featured: false,
          seo_meta_title: 'My First Post - SEO Title',
          seo_meta_description:
            'This is the SEO description for my first post.',
          category_ids: [1, 2],
          tag_ids: [1, 2, 3],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.postsService.findOne(idOrSlug);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN) // Only allow ADMIN and SUPER_ADMIN roles
  @ApiOperation({ summary: 'Update a specific post' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient role' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN) // Only allow ADMIN and SUPER_ADMIN roles
  @ApiOperation({
    summary: 'Delete a specific post',
    description: 'Delete a post by its unique ID (Admin only).',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient role' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.remove(id);
  }

  @Public() // Related posts are shown on the public blog detail page
  @Get(':id/related')
  @ApiOperation({
    summary: 'Get related posts',
    description:
      'Retrieve posts related to the specified post based on categories and tags.',
  })
  @ApiResponse({
    status: 200,
    description: 'Related posts retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient role' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async related(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.getRelatedPosts(id);
  }

  @Patch(':id/publish')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN) // Only allow ADMIN and SUPER_ADMIN roles
  @ApiOperation({
    summary: 'Publish a specific post',
    description: 'Change the status of a post to published (Admin only).',
  })
  @ApiResponse({
    status: 200,
    description: 'Post published successfully',
    schema: {
      example: {
        success: true,
        message: 'Post published successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'My First Post',
          slug: 'my-first-post',
          content: 'This is the content of the post.',
          author_id: 1,
          featured_image_url: 'https://example.com/image.jpg',
          status: 'PUBLISHED',
          scheduled_at: null,
          is_featured: false,
          seo_meta_title: 'My First Post - SEO Title',
          seo_meta_description:
            'This is the SEO description for my first post.',
          category_ids: [1, 2],
          tag_ids: [1, 2, 3],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient role' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
  @ApiResponse({ status: 200, description: 'Post published successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async publishPost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishPostDto,
  ) {
    return this.postsService.publishPost(id, dto);
  }

  @Get(':id/views')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN) // Only allow ADMIN and SUPER_ADMIN roles
  @ApiOperation({
    summary: 'Get view statistics for a specific post',
    description:
      'Retrieve view statistics for a post, including total views and recent trends.',
  })
  @ApiResponse({
    status: 200,
    description: 'View statistics retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'View statistics retrieved successfully',
        data: {
          totalViews: 1234,
          viewsLast7Days: 150,
          dailyViews: [
            { date: '2024-01-01', count: 20 },
            { date: '2024-01-02', count: 30 },
            { date: '2024-01-03', count: 25 },
            { date: '2024-01-04', count: 35 },
            { date: '2024-01-05', count: 15 },
            { date: '2024-01-06', count: 10 },
            { date: '2024-01-07', count: 15 },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient role' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  getViews(@Param('id', ParseUUIDPipe) id: string) {
    return this.analyticsService.getViewStats(id);
  }

  @Get(':id/popularity')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN) // Only allow ADMIN and SUPER_ADMIN roles
  @ApiOperation({
    summary: 'Get popularity metrics for a specific post',
    description:
      'Retrieve popularity metrics for a post based on views, likes, and shares.',
  })
  @ApiResponse({
    status: 200,
    description: 'Popularity metrics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient role' })
  getPopularity(@Param('id', ParseUUIDPipe) id: string) {
    return this.analyticsService.getPopularity(id);
  }
}
