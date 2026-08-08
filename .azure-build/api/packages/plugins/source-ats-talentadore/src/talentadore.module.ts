import { Module } from '@nestjs/common';
import { TalentAdoreService } from './talentadore.service';

@Module({
  providers: [TalentAdoreService],
  exports: [TalentAdoreService],
})
export class TalentAdoreModule {}
