import { Module } from '@nestjs/common';
import { AppliedService } from './applied.service';

@Module({
  providers: [AppliedService],
  exports: [AppliedService],
})
export class AppliedModule {}
