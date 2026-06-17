import { Test, TestingModule } from '@nestjs/testing';
import { CommentReportService } from './comment-report.service';

describe('CommentReportService', () => {
  let service: CommentReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentReportService],
    }).compile();

    service = module.get<CommentReportService>(CommentReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
