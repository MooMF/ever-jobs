import { Module } from '@nestjs/common';
import { BizneoService } from './bizneo.service';

@Module({
  providers: [BizneoService],
  exports: [BizneoService],
})
export class BizneoModule {}
