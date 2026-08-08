import { Module } from '@nestjs/common';
import { DigitalRecruitersService } from './digitalrecruiters.service';

@Module({
  providers: [DigitalRecruitersService],
  exports: [DigitalRecruitersService],
})
export class DigitalRecruitersModule {}
