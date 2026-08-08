import { Module } from '@nestjs/common';
import { IcrunchdataService } from './icrunchdata.service';

@Module({
  providers: [IcrunchdataService],
  exports: [IcrunchdataService],
})
export class IcrunchdataModule {}
