import { Module } from '@nestjs/common';
import { ScoutTalentService } from './scouttalent.service';

@Module({
  providers: [ScoutTalentService],
  exports: [ScoutTalentService],
})
export class ScoutTalentModule {}
