import { Module } from '@nestjs/common';
import { ArcoroService } from './arcoro.service';

@Module({
  providers: [ArcoroService],
  exports: [ArcoroService],
})
export class ArcoroModule {}
