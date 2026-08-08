import { Module } from '@nestjs/common';
import { SympaService } from './sympa.service';

@Module({
  providers: [SympaService],
  exports: [SympaService],
})
export class SympaModule {}
