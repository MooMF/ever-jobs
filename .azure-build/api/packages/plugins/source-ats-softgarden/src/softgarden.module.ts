import { Module } from '@nestjs/common';
import { SoftgardenService } from './softgarden.service';

@Module({
  providers: [SoftgardenService],
  exports: [SoftgardenService],
})
export class SoftgardenModule {}
