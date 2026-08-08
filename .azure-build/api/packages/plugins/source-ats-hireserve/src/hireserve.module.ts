import { Module } from '@nestjs/common';
import { HireserveService } from './hireserve.service';

@Module({
  providers: [HireserveService],
  exports: [HireserveService],
})
export class HireserveModule {}
