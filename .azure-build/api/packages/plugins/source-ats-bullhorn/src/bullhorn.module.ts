import { Module } from '@nestjs/common';
import { BullhornService } from './bullhorn.service';

@Module({
  providers: [BullhornService],
  exports: [BullhornService],
})
export class BullhornModule {}
