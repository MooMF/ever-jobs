import { Module } from '@nestjs/common';
import { VarbiService } from './varbi.service';

@Module({
  providers: [VarbiService],
  exports: [VarbiService],
})
export class VarbiModule {}
