import { Module } from '@nestjs/common';
import { ZohoRecruitService } from './zohorecruit.service';

@Module({
  providers: [ZohoRecruitService],
  exports: [ZohoRecruitService],
})
export class ZohoRecruitModule {}
