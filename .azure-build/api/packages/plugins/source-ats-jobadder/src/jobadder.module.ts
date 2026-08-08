import { Module } from '@nestjs/common';
import { JobAdderService } from './jobadder.service';

@Module({
  providers: [JobAdderService],
  exports: [JobAdderService],
})
export class JobAdderModule {}
