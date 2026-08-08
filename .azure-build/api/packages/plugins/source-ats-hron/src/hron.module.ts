import { Module } from '@nestjs/common';
import { HrOnService } from './hron.service';

@Module({
  providers: [HrOnService],
  exports: [HrOnService],
})
export class HrOnModule {}
