import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentReactionService } from './comment-reaction.service';
import { CommentReportService } from './comment-report.service';
import { ReactionType, UserRole } from '../enums/blog.enums';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/enums/role.enum';
import { ReportCommentDto } from './dto/report-comment.dto';

@ApiTags('Comments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Controller()
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly commentReactionService: CommentReactionService,
    private readonly commentReportService: CommentReportService,
  ) {}

  // POST /posts/:postId/comments
  @ApiOperation({
    summary: 'Create a comment for a post',
    description:
      'Create a comment for a specific post. Optionally, you can reply to another comment by providing parent_id.',
  })
  @ApiResponse({
    status: 201,
    description: 'The comment has been successfully created.',
    type: CreateCommentDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post or parent comment not found.',
  })
  @ApiNotFoundResponse({
    description: 'Post or parent comment not found.',
  })
  @Post('posts/:postId/comments')
  create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.commentsService.createComment(postId, userId, createCommentDto);
  }

  // GET /posts/:postId/comments
  @Public() // Allow public access to view comments
  @ApiOperation({
    summary: 'Find comments for a post',
    description: 'Retrieve all comments for a specific post.',
  })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully.',
    type: [CreateCommentDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found.',
  })
  @ApiNotFoundResponse({
    description: 'Post not found.',
  })
  @ApiParam({
    name: 'postId',
    description: 'ID of the post to retrieve comments for (should be a UUID)',
    type: String,
  })
  @Get('posts/:postId/comments')
  findCommentsByPost(@Param('postId', ParseUUIDPipe) postId: string) {
    return this.commentsService.findCommentsByPost(postId);
  }

  // GET /comments/:id
  @Public() // Allow public access to view a single comment
  @ApiOperation({
    summary: 'Find a comment by ID',
    description: 'Retrieve a single comment by its ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment retrieved successfully.',
    type: CreateCommentDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found.',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the comment to retrieve (should be a UUID)',
    type: String,
  })
  @Get('comments/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentsService.findOne(id);
  }

  // PATCH /comments/:id
  @ApiOperation({
    summary: 'Update a comment',
    description: 'Update the content of an existing comment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully.',
    type: CreateCommentDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You can only edit your own comments.',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the comment to update (should be a UUID)',
    type: String,
  })
  @Patch('comments/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.commentsService.update(id, updateCommentDto, userId);
  }

  // DELETE /comments/:id
  @ApiOperation({
    summary: 'Delete a comment',
    description: 'Delete an existing comment by its ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment deleted successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You can only delete your own comments.',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the comment to delete (should be a UUID)',
    type: String,
  })
  @Delete('comments/:id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: string,
  ) {
    return this.commentsService.remove(id, userId, userRole);
  }

  // POST /comments/:id/react
  @ApiOperation({
    summary: 'React to a comment',
    description: 'Like or dislike a comment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reaction added/updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found.',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the comment to react to (should be a UUID)',
    type: String,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid reaction type.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden. You can only react to comments if you are authenticated.',
  })
  @Post('comments/:id/react')
  react(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('type') type: ReactionType,
    @CurrentUser('id') userId: number,
  ) {
    return this.commentReactionService.react(id, userId, type);
  }

  // DELETE /comments/:id/react
  @ApiOperation({
    summary: 'Remove reaction from a comment',
    description: 'Remove your like or dislike reaction from a comment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reaction removed successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found.',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden. You can only remove reactions from comments if you are authenticated.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the comment to remove reaction from (should be a UUID)',
    type: String,
  })
  @Delete('comments/:id/react')
  removeReaction(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.commentReactionService.remove(id, userId);
  }

  // POST /comments/:id/report
  @ApiOperation({
    summary: 'Report a comment',
    description: 'Report a comment for inappropriate content.',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment reported successfully.',
    schema: {
      example: {
        message: 'Comment reported successfully',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found.',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden. You can only report comments if you are authenticated.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the comment to report (should be a UUID)',
    type: String,
  })
  @Post('comments/:id/report')
  report(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { reason }: ReportCommentDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.commentReportService.report(id, userId, reason);
  }

  // GET /reports/comments
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get all pending comment reports',
    description: 'Retrieve all pending reports for comments (Admin only).',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending reports retrieved successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You can only view reports if you are an admin.',
  })
  @Get('reports/comments')
  findAllPendingReports() {
    return this.commentReportService.findAllPending();
  }

  // PATCH /reports/comments/:reportId/resolve
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Resolve a comment report',
    description:
      'Resolve a pending comment report by either dismissing it or taking action on the comment (Admin only).',
  })
  @ApiResponse({
    status: 200,
    description: 'Report resolved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You can only resolve reports if you are an admin.',
  })
  @ApiParam({
    name: 'reportId',
    description: 'ID of the report to resolve (should be an integer)',
    type: Number,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid report ID.',
  })
  @Patch('reports/comments/:reportId/resolve')
  resolveReport(
    @Param('reportId', ParseIntPipe) reportId: number,
    @CurrentUser('id') adminId: number,
  ) {
    return this.commentReportService.resolve(reportId, adminId);
  }
}
