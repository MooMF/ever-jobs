import { Module } from '@nestjs/common';
import { JobsChService } from './jobsch.service';

@Module({
  providers: [JobsChService],
  exports: [JobsChService],
})
export class JobsChModule {}
