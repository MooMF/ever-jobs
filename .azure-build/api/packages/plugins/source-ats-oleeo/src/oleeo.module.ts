import { Module } from '@nestjs/common';
import { OleeoService } from './oleeo.service';

@Module({
  providers: [OleeoService],
  exports: [OleeoService],
})
export class OleeoModule {}
