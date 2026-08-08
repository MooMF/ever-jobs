import { Module } from '@nestjs/common';
import { NaukriService } from './naukri.service';

@Module({
  providers: [NaukriService],
  exports: [NaukriService],
})
export class NaukriModule {}
