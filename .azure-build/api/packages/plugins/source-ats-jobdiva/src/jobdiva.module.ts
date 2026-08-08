import { Module } from '@nestjs/common';
import { JobDivaService } from './jobdiva.service';

@Module({
  providers: [JobDivaService],
  exports: [JobDivaService],
})
export class JobDivaModule {}
