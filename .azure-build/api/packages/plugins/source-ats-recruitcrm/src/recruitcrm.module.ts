import { Module } from '@nestjs/common';
import { RecruitCrmService } from './recruitcrm.service';

@Module({
  providers: [RecruitCrmService],
  exports: [RecruitCrmService],
})
export class RecruitCrmModule {}
