import { Module } from '@nestjs/common';
import { BrassRingService } from './brassring.service';

@Module({
  providers: [BrassRingService],
  exports: [BrassRingService],
})
export class BrassRingModule {}
