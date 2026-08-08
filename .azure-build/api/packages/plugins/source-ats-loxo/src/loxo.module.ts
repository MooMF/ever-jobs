import { Module } from '@nestjs/common';
import { LoxoService } from './loxo.service';

@Module({
  providers: [LoxoService],
  exports: [LoxoService],
})
export class LoxoModule {}
