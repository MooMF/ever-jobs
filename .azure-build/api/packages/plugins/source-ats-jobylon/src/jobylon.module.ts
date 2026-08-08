import { Module } from '@nestjs/common';
import { JobylonService } from './jobylon.service';

@Module({
  providers: [JobylonService],
  exports: [JobylonService],
})
export class JobylonModule {}
