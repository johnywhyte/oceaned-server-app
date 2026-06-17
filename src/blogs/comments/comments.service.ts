import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { Comment } from '../entities/comment.entity';
import { Post } from '../entities/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentStatus } from '../enums/blog.enums';
import { User } from 'src/user/entities/user.entity';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async createComment(
    postId: string,
    userId: number,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let parent: Comment | null = null;

    if (dto.parent_id) {
      parent = await this.commentRepository.findOne({
        where: { id: dto.parent_id },
      });

      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = this.commentRepository.create({
      content: dto.content,
      post,
      user: { id: userId } as unknown as User, // Type assertion to bypass circular dependency
      parent: parent ?? undefined, // Convert null to undefined
      status: CommentStatus.PUBLISHED,
    });

    const saved = await this.commentRepository.save(comment);

    await this.postRepository.increment({ id: postId }, 'comments_count', 1);

    return saved;
  }

  async findCommentsByPost(postId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: {
        post: { id: postId },
        parent_id: IsNull(), // Only fetch top-level comments
        status: CommentStatus.PUBLISHED,
      },
      relations: ['user', 'replies'],
      order: {
        created_at: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user', 'replies'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async update(
    id: string,
    dto: UpdateCommentDto,
    userId: number,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user', 'replies'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new UnauthorizedException('You can only edit your own comments');
    }

    Object.assign(comment, dto);
    return this.commentRepository.save(comment);
  }

  async remove(id: string, userId: number, userRole: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['post'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const isOwner = comment.user.id === userId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);

    await this.postRepository.decrement(
      { id: comment.post.id },
      'comments_count',
      1,
    );
  }
}
