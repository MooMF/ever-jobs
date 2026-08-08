import { Module } from '@nestjs/common';
import { RecruitisService } from './recruitis.service';

@Module({
  providers: [RecruitisService],
  exports: [RecruitisService],
})
export class RecruitisModule {}
