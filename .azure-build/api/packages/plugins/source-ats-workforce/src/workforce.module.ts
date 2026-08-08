import { Module } from '@nestjs/common';
import { WorkforceService } from './workforce.service';

@Module({
  providers: [WorkforceService],
  exports: [WorkforceService],
})
export class WorkforceModule {}
