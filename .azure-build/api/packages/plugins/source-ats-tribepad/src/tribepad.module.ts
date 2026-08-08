import { Module } from '@nestjs/common';
import { TribepadService } from './tribepad.service';

@Module({
  providers: [TribepadService],
  exports: [TribepadService],
})
export class TribepadModule {}
