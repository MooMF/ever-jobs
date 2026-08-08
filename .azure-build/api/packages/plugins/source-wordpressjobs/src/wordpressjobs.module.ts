import { Module } from '@nestjs/common';
import { WordPressJobsService } from './wordpressjobs.service';

@Module({
  providers: [WordPressJobsService],
  exports: [WordPressJobsService],
})
export class WordPressJobsModule {}
