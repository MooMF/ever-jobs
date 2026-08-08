import { Module } from '@nestjs/common';
import { SmartRecruitersService } from './smartrecruiters.service';

@Module({
  providers: [SmartRecruitersService],
  exports: [SmartRecruitersService],
})
export class SmartRecruitersModule {}
