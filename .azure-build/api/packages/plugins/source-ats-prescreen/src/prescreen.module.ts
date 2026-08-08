import { Module } from '@nestjs/common';
import { PrescreenService } from './prescreen.service';

@Module({
  providers: [PrescreenService],
  exports: [PrescreenService],
})
export class PrescreenModule {}
