import { Module } from '@nestjs/common';
import { VueJobsService } from './vuejobs.service';

@Module({
  providers: [VueJobsService],
  exports: [VueJobsService],
})
export class VueJobsModule {}
