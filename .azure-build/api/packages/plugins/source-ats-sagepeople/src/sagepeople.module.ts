import { Module } from '@nestjs/common';
import { SagePeopleService } from './sagepeople.service';

@Module({
  providers: [SagePeopleService],
  exports: [SagePeopleService],
})
export class SagePeopleModule {}
