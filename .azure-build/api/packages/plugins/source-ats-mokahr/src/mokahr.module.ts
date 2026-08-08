import { Module } from '@nestjs/common';
import { MokaHrService } from './mokahr.service';

@Module({
  providers: [MokaHrService],
  exports: [MokaHrService],
})
export class MokaHrModule {}
