import { Module } from '@nestjs/common';
import { AuthenticJobsService } from './authenticjobs.service';

@Module({
  providers: [AuthenticJobsService],
  exports: [AuthenticJobsService],
})
export class AuthenticJobsModule {}
