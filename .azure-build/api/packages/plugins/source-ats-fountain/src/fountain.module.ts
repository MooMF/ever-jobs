import { Module } from '@nestjs/common';
import { FountainService } from './fountain.service';

@Module({
  providers: [FountainService],
  exports: [FountainService],
})
export class FountainModule {}
