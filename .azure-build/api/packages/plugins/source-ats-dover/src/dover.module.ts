import { Module } from '@nestjs/common';
import { DoverService } from './dover.service';

@Module({
  providers: [DoverService],
  exports: [DoverService],
})
export class DoverModule {}
