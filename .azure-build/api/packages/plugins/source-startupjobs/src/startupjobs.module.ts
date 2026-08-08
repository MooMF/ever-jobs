import { Module } from '@nestjs/common';
import { StartupJobsService } from './startupjobs.service';

@Module({
  providers: [StartupJobsService],
  exports: [StartupJobsService],
})
export class StartupJobsModule {}
