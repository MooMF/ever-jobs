import { Module } from '@nestjs/common';
import { OtysService } from './otys.service';

@Module({
  providers: [OtysService],
  exports: [OtysService],
})
export class OtysModule {}
