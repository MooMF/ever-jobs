import { Module } from '@nestjs/common';
import { RipplingService } from './rippling.service';

@Module({
  providers: [RipplingService],
  exports: [RipplingService],
})
export class RipplingModule {}
