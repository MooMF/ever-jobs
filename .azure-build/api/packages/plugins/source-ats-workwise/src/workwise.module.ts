import { Module } from '@nestjs/common';
import { WorkwiseService } from './workwise.service';

@Module({
  providers: [WorkwiseService],
  exports: [WorkwiseService],
})
export class WorkwiseModule {}
