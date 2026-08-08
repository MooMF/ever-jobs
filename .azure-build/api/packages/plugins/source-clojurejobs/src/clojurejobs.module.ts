import { Module } from '@nestjs/common';
import { ClojurejobsService } from './clojurejobs.service';

@Module({
  providers: [ClojurejobsService],
  exports: [ClojurejobsService],
})
export class ClojurejobsModule {}
