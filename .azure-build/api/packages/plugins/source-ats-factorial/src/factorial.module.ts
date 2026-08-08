import { Module } from '@nestjs/common';
import { FactorialService } from './factorial.service';

@Module({
  providers: [FactorialService],
  exports: [FactorialService],
})
export class FactorialModule {}
