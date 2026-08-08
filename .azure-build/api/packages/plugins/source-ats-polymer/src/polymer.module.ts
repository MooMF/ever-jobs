import { Module } from '@nestjs/common';
import { PolymerService } from './polymer.service';

@Module({
  providers: [PolymerService],
  exports: [PolymerService],
})
export class PolymerModule {}
