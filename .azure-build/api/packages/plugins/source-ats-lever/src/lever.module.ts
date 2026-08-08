import { Module } from '@nestjs/common';
import { LeverService } from './lever.service';

@Module({
  providers: [LeverService],
  exports: [LeverService],
})
export class LeverModule {}
