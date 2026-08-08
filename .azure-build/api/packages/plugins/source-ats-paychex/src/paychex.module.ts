import { Module } from '@nestjs/common';
import { PaychexService } from './paychex.service';

@Module({
  providers: [PaychexService],
  exports: [PaychexService],
})
export class PaychexModule {}
