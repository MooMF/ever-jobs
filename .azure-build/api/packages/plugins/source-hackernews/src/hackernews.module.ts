import { Module } from '@nestjs/common';
import { HackerNewsService } from './hackernews.service';

@Module({
  providers: [HackerNewsService],
  exports: [HackerNewsService],
})
export class HackerNewsModule {}
