import { Module } from '@nestjs/common';
import { HarriService } from './harri.service';

@Module({
  providers: [HarriService],
  exports: [HarriService],
})
export class HarriModule {}
