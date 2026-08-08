import { Module } from '@nestjs/common';
import { EasyCruitService } from './easycruit.service';

@Module({
  providers: [EasyCruitService],
  exports: [EasyCruitService],
})
export class EasyCruitModule {}
