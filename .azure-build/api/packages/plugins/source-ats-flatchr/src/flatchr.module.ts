import { Module } from '@nestjs/common';
import { FlatchrService } from './flatchr.service';

@Module({
  providers: [FlatchrService],
  exports: [FlatchrService],
})
export class FlatchrModule {}
