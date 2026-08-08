import { Module } from '@nestjs/common';
import { UndpJobsService } from './undpjobs.service';

@Module({
  providers: [UndpJobsService],
  exports: [UndpJobsService],
})
export class UndpJobsModule {}
