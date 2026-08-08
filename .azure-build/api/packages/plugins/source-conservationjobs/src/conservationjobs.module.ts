import { Module } from '@nestjs/common';
import { ConservationJobsService } from './conservationjobs.service';

@Module({
  providers: [ConservationJobsService],
  exports: [ConservationJobsService],
})
export class ConservationJobsModule {}
