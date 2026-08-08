import { Module } from '@nestjs/common';
import { HrOneService } from './hrone.service';

@Module({
  providers: [HrOneService],
  exports: [HrOneService],
})
export class HrOneModule {}
