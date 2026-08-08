import { Module } from '@nestjs/common';
import { RailsJobsService } from './railsjobs.service';

@Module({
  providers: [RailsJobsService],
  exports: [RailsJobsService],
})
export class RailsJobsModule {}
