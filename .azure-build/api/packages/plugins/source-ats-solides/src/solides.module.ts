import { Module } from '@nestjs/common';
import { SolidesService } from './solides.service';

@Module({
  providers: [SolidesService],
  exports: [SolidesService],
})
export class SolidesModule {}
