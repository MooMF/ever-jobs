import { Module } from '@nestjs/common';
import { BDJobsService } from './bdjobs.service';

@Module({
  providers: [BDJobsService],
  exports: [BDJobsService],
})
export class BDJobsModule {}
