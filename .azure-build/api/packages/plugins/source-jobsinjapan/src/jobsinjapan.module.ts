import { Module } from '@nestjs/common';
import { JobsInJapanService } from './jobsinjapan.service';

@Module({
  providers: [JobsInJapanService],
  exports: [JobsInJapanService],
})
export class JobsInJapanModule {}
