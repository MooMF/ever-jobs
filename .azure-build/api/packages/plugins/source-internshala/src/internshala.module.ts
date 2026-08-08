import { Module } from '@nestjs/common';
import { InternshalaService } from './internshala.service';

@Module({
  providers: [InternshalaService],
  exports: [InternshalaService],
})
export class InternshalaModule {}
