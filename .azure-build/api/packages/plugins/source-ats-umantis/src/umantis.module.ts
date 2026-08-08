import { Module } from '@nestjs/common';
import { UmantisService } from './umantis.service';

@Module({
  providers: [UmantisService],
  exports: [UmantisService],
})
export class UmantisModule {}
