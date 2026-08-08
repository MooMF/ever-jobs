import { Module } from '@nestjs/common';
import { AltamiraService } from './altamira.service';

@Module({
  providers: [AltamiraService],
  exports: [AltamiraService],
})
export class AltamiraModule {}
