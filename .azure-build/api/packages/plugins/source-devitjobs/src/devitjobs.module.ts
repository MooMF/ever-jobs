import { Module } from '@nestjs/common';
import { DevITJobsService } from './devitjobs.service';

@Module({
  providers: [DevITJobsService],
  exports: [DevITJobsService],
})
export class DevITJobsModule {}
