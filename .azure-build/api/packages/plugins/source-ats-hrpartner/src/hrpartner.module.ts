import { Module } from '@nestjs/common';
import { HrPartnerService } from './hrpartner.service';

@Module({
  providers: [HrPartnerService],
  exports: [HrPartnerService],
})
export class HrPartnerModule {}
