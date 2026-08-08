import { Module } from '@nestjs/common';
import { JobindexService } from './jobindex.service';

@Module({
  providers: [JobindexService],
  exports: [JobindexService],
})
export class JobindexModule {}
