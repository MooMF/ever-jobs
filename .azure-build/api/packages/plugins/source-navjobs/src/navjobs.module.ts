import { Module } from '@nestjs/common';
import { NavJobsService } from './navjobs.service';

@Module({
  providers: [NavJobsService],
  exports: [NavJobsService],
})
export class NavJobsModule {}
