import { Module } from '@nestjs/common';
import { JobstreetService } from './jobstreet.service';

@Module({
  providers: [JobstreetService],
  exports: [JobstreetService],
})
export class JobstreetModule {}
