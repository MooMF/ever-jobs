import { Module } from '@nestjs/common';
import { JobtrainService } from './jobtrain.service';

@Module({
  providers: [JobtrainService],
  exports: [JobtrainService],
})
export class JobtrainModule {}
