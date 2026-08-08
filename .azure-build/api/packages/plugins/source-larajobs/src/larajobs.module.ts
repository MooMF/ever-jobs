import { Module } from '@nestjs/common';
import { LaraJobsService } from './larajobs.service';

@Module({
  providers: [LaraJobsService],
  exports: [LaraJobsService],
})
export class LaraJobsModule {}
