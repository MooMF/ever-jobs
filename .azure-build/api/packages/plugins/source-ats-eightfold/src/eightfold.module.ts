import { Module } from '@nestjs/common';
import { EightfoldService } from './eightfold.service';

@Module({
  providers: [EightfoldService],
  exports: [EightfoldService],
})
export class EightfoldModule {}
