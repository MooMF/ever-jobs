import { Module } from '@nestjs/common';
import { BeameryService } from './beamery.service';

@Module({
  providers: [BeameryService],
  exports: [BeameryService],
})
export class BeameryModule {}
