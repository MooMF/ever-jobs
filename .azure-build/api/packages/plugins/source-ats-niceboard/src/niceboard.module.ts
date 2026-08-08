import { Module } from '@nestjs/common';
import { NiceboardService } from './niceboard.service';

@Module({
  providers: [NiceboardService],
  exports: [NiceboardService],
})
export class NiceboardModule {}
