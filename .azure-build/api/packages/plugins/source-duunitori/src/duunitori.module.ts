import { Module } from '@nestjs/common';
import { DuunitoriService } from './duunitori.service';

@Module({
  providers: [DuunitoriService],
  exports: [DuunitoriService],
})
export class DuunitoriModule {}
