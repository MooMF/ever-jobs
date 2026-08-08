import { Module } from '@nestjs/common';
import { EchoJobsService } from './echojobs.service';

@Module({
  providers: [EchoJobsService],
  exports: [EchoJobsService],
})
export class EchoJobsModule {}
