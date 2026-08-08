import { Module } from '@nestjs/common';
import { NoFluffJobsService } from './nofluffjobs.service';

@Module({
  providers: [NoFluffJobsService],
  exports: [NoFluffJobsService],
})
export class NoFluffJobsModule {}
