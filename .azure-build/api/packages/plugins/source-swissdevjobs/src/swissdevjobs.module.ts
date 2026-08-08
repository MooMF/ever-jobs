import { Module } from '@nestjs/common';
import { SwissdevjobsService } from './swissdevjobs.service';

@Module({
  providers: [SwissdevjobsService],
  exports: [SwissdevjobsService],
})
export class SwissdevjobsModule {}
