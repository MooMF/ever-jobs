import { Module } from '@nestjs/common';
import { PaycomService } from './paycom.service';

@Module({
  providers: [PaycomService],
  exports: [PaycomService],
})
export class PaycomModule {}
