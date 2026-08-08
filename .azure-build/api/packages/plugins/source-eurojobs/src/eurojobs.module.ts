import { Module } from '@nestjs/common';
import { EurojobsService } from './eurojobs.service';

@Module({
  providers: [EurojobsService],
  exports: [EurojobsService],
})
export class EurojobsModule {}
