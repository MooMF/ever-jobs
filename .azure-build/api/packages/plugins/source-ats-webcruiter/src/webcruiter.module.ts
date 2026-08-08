import { Module } from '@nestjs/common';
import { WebcruiterService } from './webcruiter.service';

@Module({
  providers: [WebcruiterService],
  exports: [WebcruiterService],
})
export class WebcruiterModule {}
