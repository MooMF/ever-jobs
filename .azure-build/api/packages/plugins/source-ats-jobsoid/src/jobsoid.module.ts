import { Module } from '@nestjs/common';
import { JobsoidService } from './jobsoid.service';

@Module({
  providers: [JobsoidService],
  exports: [JobsoidService],
})
export class JobsoidModule {}
