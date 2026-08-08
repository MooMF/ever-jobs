import { Module } from '@nestjs/common';
import { InRecruitingService } from './inrecruiting.service';

@Module({
  providers: [InRecruitingService],
  exports: [InRecruitingService],
})
export class InRecruitingModule {}
