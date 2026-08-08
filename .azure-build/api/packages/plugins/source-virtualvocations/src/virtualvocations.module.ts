import { Module } from '@nestjs/common';
import { VirtualVocationsService } from './virtualvocations.service';

@Module({
  providers: [VirtualVocationsService],
  exports: [VirtualVocationsService],
})
export class VirtualVocationsModule {}
