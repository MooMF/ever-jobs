import { Module } from '@nestjs/common';
import { LandingJobsService } from './landingjobs.service';

@Module({
  providers: [LandingJobsService],
  exports: [LandingJobsService],
})
export class LandingJobsModule {}
