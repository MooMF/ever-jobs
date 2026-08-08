import { Module } from '@nestjs/common';
import { HReasilyService } from './hreasily.service';

@Module({
  providers: [HReasilyService],
  exports: [HReasilyService],
})
export class HReasilyModule {}
