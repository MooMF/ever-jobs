import { Module } from '@nestjs/common';
import { HiringThingService } from './hiringthing.service';

@Module({
  providers: [HiringThingService],
  exports: [HiringThingService],
})
export class HiringThingModule {}
