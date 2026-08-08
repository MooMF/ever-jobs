import { Module } from '@nestjs/common';
import { HigherEdJobsService } from './higheredjobs.service';

@Module({
  providers: [HigherEdJobsService],
  exports: [HigherEdJobsService],
})
export class HigherEdJobsModule {}
