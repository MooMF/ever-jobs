import { Module } from '@nestjs/common';
import { JobScoreService } from './jobscore.service';

@Module({
  providers: [JobScoreService],
  exports: [JobScoreService],
})
export class JobScoreModule {}
