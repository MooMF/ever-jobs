import { Module } from '@nestjs/common';
import { TheMuseService } from './themuse.service';

@Module({
  providers: [TheMuseService],
  exports: [TheMuseService],
})
export class TheMuseModule {}
