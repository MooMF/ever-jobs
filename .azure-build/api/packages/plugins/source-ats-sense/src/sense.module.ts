import { Module } from '@nestjs/common';
import { SenseService } from './sense.service';

@Module({
  providers: [SenseService],
  exports: [SenseService],
})
export class SenseModule {}
