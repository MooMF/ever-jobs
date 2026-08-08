import { Module } from '@nestjs/common';
import { KekaService } from './keka.service';

@Module({
  providers: [KekaService],
  exports: [KekaService],
})
export class KekaModule {}
