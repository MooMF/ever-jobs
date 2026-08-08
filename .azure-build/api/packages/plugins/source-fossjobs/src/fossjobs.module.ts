import { Module } from '@nestjs/common';
import { FossJobsService } from './fossjobs.service';

@Module({
  providers: [FossJobsService],
  exports: [FossJobsService],
})
export class FossJobsModule {}
