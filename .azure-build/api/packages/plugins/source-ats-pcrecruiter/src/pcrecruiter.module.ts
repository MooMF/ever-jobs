import { Module } from '@nestjs/common';
import { PCRecruiterService } from './pcrecruiter.service';

@Module({
  providers: [PCRecruiterService],
  exports: [PCRecruiterService],
})
export class PCRecruiterModule {}
