import { Module } from '@nestjs/common';
import { ZimyoService } from './zimyo.service';

@Module({
  providers: [ZimyoService],
  exports: [ZimyoService],
})
export class ZimyoModule {}
