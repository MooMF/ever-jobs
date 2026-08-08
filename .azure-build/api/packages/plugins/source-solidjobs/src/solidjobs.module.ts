import { Module } from '@nestjs/common';
import { SolidJobsService } from './solidjobs.service';

@Module({
  providers: [SolidJobsService],
  exports: [SolidJobsService],
})
export class SolidJobsModule {}
