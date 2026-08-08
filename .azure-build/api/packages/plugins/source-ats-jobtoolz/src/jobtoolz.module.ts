import { Module } from '@nestjs/common';
import { JobtoolzService } from './jobtoolz.service';

@Module({
  providers: [JobtoolzService],
  exports: [JobtoolzService],
})
export class JobtoolzModule {}
