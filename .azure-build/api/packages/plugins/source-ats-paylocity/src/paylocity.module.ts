import { Module } from '@nestjs/common';
import { PaylocityService } from './paylocity.service';

@Module({
  providers: [PaylocityService],
  exports: [PaylocityService],
})
export class PaylocityModule {}
