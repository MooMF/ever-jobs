import { Module } from '@nestjs/common';
import { TraffitService } from './traffit.service';

@Module({
  providers: [TraffitService],
  exports: [TraffitService],
})
export class TraffitModule {}
