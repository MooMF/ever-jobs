import { Module } from '@nestjs/common';
import { CareerOneStopService } from './careeronestop.service';

@Module({
  providers: [CareerOneStopService],
  exports: [CareerOneStopService],
})
export class CareerOneStopModule {}
