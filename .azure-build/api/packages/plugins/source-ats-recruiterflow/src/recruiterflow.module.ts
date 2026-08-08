import { Module } from '@nestjs/common';
import { RecruiterflowService } from './recruiterflow.service';

@Module({
  providers: [RecruiterflowService],
  exports: [RecruiterflowService],
})
export class RecruiterflowModule {}
