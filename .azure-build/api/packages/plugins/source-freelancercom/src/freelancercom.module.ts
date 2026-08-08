import { Module } from '@nestjs/common';
import { FreelancerComService } from './freelancercom.service';

@Module({
  providers: [FreelancerComService],
  exports: [FreelancerComService],
})
export class FreelancerComModule {}
