import { Module } from '@nestjs/common';
import { ApplicantProService } from './applicantpro.service';

@Module({
  providers: [ApplicantProService],
  exports: [ApplicantProService],
})
export class ApplicantProModule {}
