import { Module } from '@nestjs/common';
import { WorkdayService } from './workday.service';

@Module({
  providers: [WorkdayService],
  exports: [WorkdayService],
})
export class WorkdayModule {}
