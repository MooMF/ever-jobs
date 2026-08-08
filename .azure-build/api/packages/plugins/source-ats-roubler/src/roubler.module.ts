import { Module } from '@nestjs/common';
import { RoublerService } from './roubler.service';

@Module({
  providers: [RoublerService],
  exports: [RoublerService],
})
export class RoublerModule {}
