import { Module } from '@nestjs/common';
import { RecruitlyService } from './recruitly.service';

@Module({
  providers: [RecruitlyService],
  exports: [RecruitlyService],
})
export class RecruitlyModule {}
