import { Module } from '@nestjs/common';
import { DrupalJobsService } from './drupaljobs.service';

@Module({
  providers: [DrupalJobsService],
  exports: [DrupalJobsService],
})
export class DrupalJobsModule {}
