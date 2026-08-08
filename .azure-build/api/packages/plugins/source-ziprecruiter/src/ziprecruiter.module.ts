import { Module } from '@nestjs/common';
import { ZipRecruiterService } from './ziprecruiter.service';

@Module({
  providers: [ZipRecruiterService],
  exports: [ZipRecruiterService],
})
export class ZipRecruiterModule {}
