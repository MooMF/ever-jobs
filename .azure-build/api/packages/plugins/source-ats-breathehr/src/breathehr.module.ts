import { Module } from '@nestjs/common';
import { BreatheHrService } from './breathehr.service';

@Module({
  providers: [BreatheHrService],
  exports: [BreatheHrService],
})
export class BreatheHrModule {}
