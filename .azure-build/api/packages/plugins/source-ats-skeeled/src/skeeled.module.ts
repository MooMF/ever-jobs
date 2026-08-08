import { Module } from '@nestjs/common';
import { SkeeledService } from './skeeled.service';

@Module({
  providers: [SkeeledService],
  exports: [SkeeledService],
})
export class SkeeledModule {}
