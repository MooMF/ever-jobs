import { Module } from '@nestjs/common';
import { TalentReefService } from './talentreef.service';

@Module({
  providers: [TalentReefService],
  exports: [TalentReefService],
})
export class TalentReefModule {}
