import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';

import { Comment } from './../entities/comment.entity';
import { CommentReaction } from './../entities/comment-reaction.entity';
import { ReactionType } from './../enums/blog.enums';

@Injectable()
export class CommentReactionService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,

    @InjectRepository(CommentReaction)
    private reactionRepository: Repository<CommentReaction>,

    private dataSource: DataSource,
  ) {}

  async react(commentId: string, userId: number, type: ReactionType) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Use transaction to ensure data consistency when adding/updating reactions and counts
    // This handles all cases: new reaction, changing reaction, and ensures counts are accurate
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(CommentReaction, {
        where: {
          comment: { id: commentId },
          user: { id: userId },
        },
        relations: ['comment', 'user'],
      });

      // Case 1: no reaction yet → create
      if (!existing) {
        const reaction = manager.create(CommentReaction, {
          comment,
          user: { id: userId },
          reaction: type,
        });

        await manager.save(reaction);

        await this.incrementCount(manager, commentId, type, 1);

        return { message: 'Reaction added' };
      }

      // Case 2: same reaction → do nothing
      if (existing.reaction === type) {
        return { message: 'Already reacted' };
      }

      // Case 3: switch reaction
      const previousType = existing.reaction;
      existing.reaction = type;

      await manager.save(existing);

      // Decrement previous reaction count and increment new reaction count
      await this.incrementCount(manager, commentId, previousType, -1);
      await this.incrementCount(manager, commentId, type, 1);

      return { message: 'Reaction updated' };
    });
  }

  async remove(commentId: string, userId: number) {
    const existing = await this.reactionRepository.findOne({
      where: {
        comment: { id: commentId },
        user: { id: userId },
      },
      relations: ['comment', 'user'],
    });

    if (!existing) {
      return { message: 'No reaction to remove' };
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.remove(existing);

      await this.incrementCount(manager, commentId, existing.reaction, -1);
    });

    return { message: 'Reaction removed' };
  }

  private async incrementCount(
    manager: EntityManager,
    commentId: string,
    type: ReactionType,
    value: number,
  ) {
    if (type === ReactionType.LIKE) {
      await manager.increment(Comment, { id: commentId }, 'likes_count', value);
    } else {
      await manager.increment(
        Comment,
        { id: commentId },
        'dislikes_count',
        value,
      );
    }
  }
}
