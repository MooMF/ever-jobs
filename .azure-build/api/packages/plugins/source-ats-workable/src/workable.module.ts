import { Module } from '@nestjs/common';
import { WorkableService } from './workable.service';

@Module({
  providers: [WorkableService],
  exports: [WorkableService],
})
export class WorkableModule {}
