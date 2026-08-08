import { Module } from '@nestjs/common';
import { FunctionalworksService } from './functionalworks.service';

@Module({
  providers: [FunctionalworksService],
  exports: [FunctionalworksService],
})
export class FunctionalworksModule {}
