import { Module } from '@nestjs/common';
import { HeyrecruitService } from './heyrecruit.service';

@Module({
  providers: [HeyrecruitService],
  exports: [HeyrecruitService],
})
export class HeyrecruitModule {}
