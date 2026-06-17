import {
  Controller,
  Delete,
  Param,
  Post,
  Get,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PostLikesService } from './post-likes.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Post Likes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Controller('posts/:postId/like')
export class PostLikesController {
  constructor(private readonly postLikesService: PostLikesService) {}

  // POST /posts/:postId/like
  @ApiOperation({
    summary: 'Like a post',
    description:
      'Like a specific post. If you already liked it, this will unlike it.',
  })
  @ApiResponse({
    status: 200,
    description: 'The post has been liked successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Post already liked.',
  })
  @ApiParam({
    name: 'postId',
    type: 'string',
    description: 'ID of the post to like',
  })
  @Post()
  async likePost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.postLikesService.likePost(postId, userId);
  }

  // GET /posts/:postId/like/me
  @ApiOperation({
    summary: 'Check if the current user has liked a post',
    description:
      'Check if the current authenticated user has liked a specific post.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns true if the user has liked the post, false otherwise.',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found.',
  })
  @ApiParam({
    name: 'postId',
    type: 'string',
    description: 'ID of the post to check',
  })
  @Get()
  async hasUserLiked(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.postLikesService.hasUserLiked(postId, userId);
  }

  // GET /posts/:postId/like/count
  @Public() // Allow public access to view likes count
  @ApiOperation({
    summary: 'Get the total number of likes for a post',
    description: 'Retrieve the total count of likes for a specific post.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the total number of likes for the post.',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found.',
  })
  @ApiParam({
    name: 'postId',
    type: 'string',
    description: 'ID of the post to get likes count for',
  })
  @Get('count')
  async getPostLikesCount(@Param('postId', ParseUUIDPipe) postId: string) {
    return this.postLikesService.getPostLikesCount(postId);
  }

  // GET /posts/:postId/like/me
  @ApiOperation({
    summary: 'Check if the current user has liked a post',
    description:
      'Check if the current authenticated user has liked a specific post.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns true if the user has liked the post, false otherwise.',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found.',
  })
  @ApiParam({
    name: 'postId',
    type: 'string',
    description: 'ID of the post to check',
  })
  @Get('me')
  async getMyLikes(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.postLikesService.hasUserLiked(postId, userId);
  }

  // DELETE /posts/:postId/like
  @ApiOperation({
    summary: 'Unlike a post',
    description: 'Remove your like from a specific post.',
  })
  @ApiResponse({
    status: 200,
    description: 'The post has been unliked successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Like not found.',
  })
  @ApiParam({
    name: 'postId',
    type: 'string',
    description: 'ID of the post to unlike',
  })
  @Delete()
  async unlikePost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.postLikesService.unlikePost(postId, userId);
  }
}
