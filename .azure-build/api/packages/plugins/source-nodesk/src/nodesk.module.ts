import { Module } from '@nestjs/common';
import { NoDeskService } from './nodesk.service';

@Module({
  providers: [NoDeskService],
  exports: [NoDeskService],
})
export class NoDeskModule {}
