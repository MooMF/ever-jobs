import { Module } from '@nestjs/common';
import { BeetweenService } from './beetween.service';

@Module({
  providers: [BeetweenService],
  exports: [BeetweenService],
})
export class BeetweenModule {}
