import { Module } from '@nestjs/common';
import { DjinniService } from './djinni.service';

@Module({
  providers: [DjinniService],
  exports: [DjinniService],
})
export class DjinniModule {}
