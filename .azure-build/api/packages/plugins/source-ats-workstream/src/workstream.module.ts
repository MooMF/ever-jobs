import { Module } from '@nestjs/common';
import { WorkstreamService } from './workstream.service';

@Module({
  providers: [WorkstreamService],
  exports: [WorkstreamService],
})
export class WorkstreamModule {}
