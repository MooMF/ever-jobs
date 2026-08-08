import { Module } from '@nestjs/common';
import { AshbyService } from './ashby.service';

@Module({
  providers: [AshbyService],
  exports: [AshbyService],
})
export class AshbyModule {}
