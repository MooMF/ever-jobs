import { Module } from '@nestjs/common';
import { WorkingNomadsService } from './workingnomads.service';

@Module({
  providers: [WorkingNomadsService],
  exports: [WorkingNomadsService],
})
export class WorkingNomadsModule {}
