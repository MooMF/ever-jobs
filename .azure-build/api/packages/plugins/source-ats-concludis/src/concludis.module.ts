import { Module } from '@nestjs/common';
import { ConcludisService } from './concludis.service';

@Module({
  providers: [ConcludisService],
  exports: [ConcludisService],
})
export class ConcludisModule {}
