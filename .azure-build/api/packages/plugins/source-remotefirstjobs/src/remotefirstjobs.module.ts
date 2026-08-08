import { Module } from '@nestjs/common';
import { RemotefirstjobsService } from './remotefirstjobs.service';

@Module({
  providers: [RemotefirstjobsService],
  exports: [RemotefirstjobsService],
})
export class RemotefirstjobsModule {}
