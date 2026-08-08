import { Module } from '@nestjs/common';
import { JobsdbService } from './jobsdb.service';

@Module({
  providers: [JobsdbService],
  exports: [JobsdbService],
})
export class JobsdbModule {}
