import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ReportStatus } from '../enums/blog.enums';

import { Comment } from './../entities/comment.entity';
import { CommentReport } from './../entities/comment-report.entity';
import { User } from 'src/user/entities/user.entity';
import { ReportCommentDto } from './dto/report-comment.dto';

@Injectable()
export class CommentReportService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,

    @InjectRepository(CommentReport)
    private reportRepository: Repository<CommentReport>,
  ) {}

  async report(
    commentId: string,
    userId: number,
    reason: ReportCommentDto['reason'],
  ) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const existing = await this.reportRepository.findOne({
      where: {
        comment: { id: commentId },
        reported_by: { id: userId },
      },
      relations: ['comment', 'reported_by'],
    });

    if (existing) {
      throw new BadRequestException('You already reported this comment');
    }

    const report = this.reportRepository.create({
      comment,
      reported_by: { id: userId },
      reason,
      status: ReportStatus.PENDING,
    });

    await this.reportRepository.save(report);

    return { message: 'Comment reported successfully' };
  }

  async findAllPending() {
    return this.reportRepository.find({
      where: { status: ReportStatus.PENDING },
      relations: ['comment', 'reported_by'],
      order: { created_at: 'DESC' },
    });
  }

  async resolve(reportId: number, adminId: number) {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.reviewed_by = { id: adminId } as unknown as User; // Type assertion to bypass circular dependency

    report.status = ReportStatus.RESOLVED;

    await this.reportRepository.save(report);

    return { message: 'Report resolved' };
  }
}
