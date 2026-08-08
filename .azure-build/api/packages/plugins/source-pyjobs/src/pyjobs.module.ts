import { Module } from '@nestjs/common';
import { PyJobsService } from './pyjobs.service';

@Module({
  providers: [PyJobsService],
  exports: [PyJobsService],
})
export class PyJobsModule {}
