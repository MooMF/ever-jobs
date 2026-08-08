import { Module } from '@nestjs/common';
import { StepStoneService } from './stepstone.service';

@Module({
  providers: [StepStoneService],
  exports: [StepStoneService],
})
export class StepStoneModule {}
