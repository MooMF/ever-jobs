import { Module } from '@nestjs/common';
import { VidCruiterService } from './vidcruiter.service';

@Module({
  providers: [VidCruiterService],
  exports: [VidCruiterService],
})
export class VidCruiterModule {}
