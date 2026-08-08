import { Module } from '@nestjs/common';
import { JobDataApiService } from './jobdataapi.service';

@Module({
  providers: [JobDataApiService],
  exports: [JobDataApiService],
})
export class JobDataApiModule {}
