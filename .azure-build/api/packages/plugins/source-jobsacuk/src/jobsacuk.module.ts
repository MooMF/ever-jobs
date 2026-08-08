import { Module } from '@nestjs/common';
import { JobsAcUkService } from './jobsacuk.service';

@Module({
  providers: [JobsAcUkService],
  exports: [JobsAcUkService],
})
export class JobsAcUkModule {}
