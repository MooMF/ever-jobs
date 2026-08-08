import { Module } from '@nestjs/common';
import { SesameHrService } from './sesamehr.service';

@Module({
  providers: [SesameHrService],
  exports: [SesameHrService],
})
export class SesameHrModule {}
