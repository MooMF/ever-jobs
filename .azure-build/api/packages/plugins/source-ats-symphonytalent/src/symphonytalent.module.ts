import { Module } from '@nestjs/common';
import { SymphonyTalentService } from './symphonytalent.service';

@Module({
  providers: [SymphonyTalentService],
  exports: [SymphonyTalentService],
})
export class SymphonyTalentModule {}
