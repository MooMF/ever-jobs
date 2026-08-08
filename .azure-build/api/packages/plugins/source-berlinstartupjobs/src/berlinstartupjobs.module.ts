import { Module } from '@nestjs/common';
import { BerlinStartupJobsService } from './berlinstartupjobs.service';

@Module({
  providers: [BerlinStartupJobsService],
  exports: [BerlinStartupJobsService],
})
export class BerlinStartupJobsModule {}
