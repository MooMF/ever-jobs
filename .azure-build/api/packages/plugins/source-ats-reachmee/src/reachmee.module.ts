import { Module } from '@nestjs/common';
import { ReachMeeService } from './reachmee.service';

@Module({
  providers: [ReachMeeService],
  exports: [ReachMeeService],
})
export class ReachMeeModule {}
