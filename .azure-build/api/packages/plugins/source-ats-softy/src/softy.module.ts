import { Module } from '@nestjs/common';
import { SoftyService } from './softy.service';

@Module({
  providers: [SoftyService],
  exports: [SoftyService],
})
export class SoftyModule {}
