import { Test, TestingModule } from '@nestjs/testing';
import { CommentReactionService } from './comment-reaction.service';

describe('CommentReactionService', () => {
  let service: CommentReactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentReactionService],
    }).compile();

    service = module.get<CommentReactionService>(CommentReactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
