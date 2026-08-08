import { Module } from '@nestjs/common';
import { KenjoService } from './kenjo.service';

@Module({
  providers: [KenjoService],
  exports: [KenjoService],
})
export class KenjoModule {}
