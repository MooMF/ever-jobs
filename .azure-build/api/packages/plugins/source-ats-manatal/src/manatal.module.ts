import { Module } from '@nestjs/common';
import { ManatalService } from './manatal.service';

@Module({
  providers: [ManatalService],
  exports: [ManatalService],
})
export class ManatalModule {}
