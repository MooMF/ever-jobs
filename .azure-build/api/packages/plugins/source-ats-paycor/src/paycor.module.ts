import { Module } from '@nestjs/common';
import { PaycorService } from './paycor.service';

@Module({
  providers: [PaycorService],
  exports: [PaycorService],
})
export class PaycorModule {}
