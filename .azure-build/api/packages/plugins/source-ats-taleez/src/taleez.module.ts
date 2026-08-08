import { Module } from '@nestjs/common';
import { TaleezService } from './taleez.service';

@Module({
  providers: [TaleezService],
  exports: [TaleezService],
})
export class TaleezModule {}
