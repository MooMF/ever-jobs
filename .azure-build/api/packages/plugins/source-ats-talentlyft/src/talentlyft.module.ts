import { Module } from '@nestjs/common';
import { TalentLyftService } from './talentlyft.service';

@Module({
  providers: [TalentLyftService],
  exports: [TalentLyftService],
})
export class TalentLyftModule {}
