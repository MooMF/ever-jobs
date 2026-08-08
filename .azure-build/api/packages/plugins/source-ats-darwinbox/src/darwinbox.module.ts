import { Module } from '@nestjs/common';
import { DarwinboxService } from './darwinbox.service';

@Module({
  providers: [DarwinboxService],
  exports: [DarwinboxService],
})
export class DarwinboxModule {}
