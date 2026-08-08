import { Module } from '@nestjs/common';
import { DayforceService } from './dayforce.service';

@Module({
  providers: [DayforceService],
  exports: [DayforceService],
})
export class DayforceModule {}
