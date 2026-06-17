import {
  Controller,
  Post,
  Param,
  Delete,
  Get,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SavedPostsService } from './saved-posts.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('Saved Posts')
@Controller()
export class SavedPostsController {
  constructor(private readonly savedPostsService: SavedPostsService) {}

  // POST /posts/:postId/save
  @ApiOperation({
    summary: 'Save a post',
    description: 'Save a specific post to your saved posts list.',
  })
  @ApiResponse({
    status: 200,
    description: 'The post has been saved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Post already saved.',
  })
  @ApiParam({
    name: 'postId',
    type: 'string',
    description: 'ID of the post to save',
  })
  @Post('/posts/:postId/save')
  async savePost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.savedPostsService.savePost(postId, userId);
  }

  // DELETE /posts/:postId/save
  @ApiOperation({
    summary: 'Remove a saved post',
    description: 'Remove a specific post from your saved posts list.',
  })
  @ApiResponse({
    status: 200,
    description: 'The post has been removed from saved posts successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Saved post not found.',
  })
  @ApiParam({
    name: 'postId',
    type: 'string',
    description: 'ID of the post to remove from saved posts',
  })
  @Delete('/posts/:postId/save')
  async removeSavedPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.savedPostsService.removeSavedPost(postId, userId);
  }

  // GET /me/saved-posts
  @ApiOperation({
    summary: 'Get my saved posts',
    description: 'Retrieve a list of posts that the current user has saved.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of saved posts for the current user.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. User must be authenticated.',
  })
  @Get('/me/saved-posts')
  async getMySavedPosts(@CurrentUser('id') userId: number) {
    return this.savedPostsService.getUserSavedPosts(userId);
  }
}
