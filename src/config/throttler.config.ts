import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

export const getThrottlerConfig = (configService: ConfigService): ThrottlerModuleOptions => {
  return {
    throttlers: [
      {
        ttl: configService.get<number>('RATE_LIMIT_WINDOW_MS', 60000), // 60 seconds
        limit: configService.get<number>('RATE_LIMIT_MAX_REQUESTS', 100), // 100 requests
      },
    ],
  };
};