import { Module } from '@nestjs/common';
import { FourDayWeekService } from './fourdayweek.service';

@Module({
  providers: [FourDayWeekService],
  exports: [FourDayWeekService],
})
export class FourDayWeekModule {}
