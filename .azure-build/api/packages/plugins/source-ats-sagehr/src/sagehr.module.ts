import { Module } from '@nestjs/common';
import { SageHrService } from './sagehr.service';

@Module({
  providers: [SageHrService],
  exports: [SageHrService],
})
export class SageHrModule {}
