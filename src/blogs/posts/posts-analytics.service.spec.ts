import { Test, TestingModule } from '@nestjs/testing';
import { PostsAnalyticsService } from './posts-analytics.service';

describe('PostsAnalyticsService', () => {
  let service: PostsAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostsAnalyticsService],
    }).compile();

    service = module.get<PostsAnalyticsService>(PostsAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
