import { Module } from '@nestjs/common';
import { ApplicantStackService } from './applicantstack.service';

@Module({
  providers: [ApplicantStackService],
  exports: [ApplicantStackService],
})
export class ApplicantStackModule {}
