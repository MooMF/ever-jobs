import { Module } from '@nestjs/common';
import { ISmartRecruitService } from './ismartrecruit.service';

@Module({
  providers: [ISmartRecruitService],
  exports: [ISmartRecruitService],
})
export class ISmartRecruitModule {}
