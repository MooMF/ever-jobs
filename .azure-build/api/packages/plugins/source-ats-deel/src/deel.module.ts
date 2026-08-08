import { Module } from '@nestjs/common';
import { DeelService } from './deel.service';

@Module({
  providers: [DeelService],
  exports: [DeelService],
})
export class DeelModule {}
