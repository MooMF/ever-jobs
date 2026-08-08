import { Module } from '@nestjs/common';
import { GolangJobsService } from './golangjobs.service';

@Module({
  providers: [GolangJobsService],
  exports: [GolangJobsService],
})
export class GolangJobsModule {}
