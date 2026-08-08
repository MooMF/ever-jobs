import { Module } from '@nestjs/common';
import { GreenhouseService } from './greenhouse.service';

@Module({
  providers: [GreenhouseService],
  exports: [GreenhouseService],
})
export class GreenhouseModule {}
