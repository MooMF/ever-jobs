import { Module } from '@nestjs/common';
import { Web3CareerService } from './web3career.service';

@Module({
  providers: [Web3CareerService],
  exports: [Web3CareerService],
})
export class Web3CareerModule {}
