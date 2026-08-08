import { Module } from '@nestjs/common';
import { BeisenService } from './beisen.service';

@Module({
  providers: [BeisenService],
  exports: [BeisenService],
})
export class BeisenModule {}
