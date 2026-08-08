import { Module } from '@nestjs/common';
import { RecruitezeService } from './recruiteze.service';

@Module({
  providers: [RecruitezeService],
  exports: [RecruitezeService],
})
export class RecruitezeModule {}
