import { Module } from '@nestjs/common';
import { CryptocurrencyJobsService } from './cryptocurrencyjobs.service';

@Module({
  providers: [CryptocurrencyJobsService],
  exports: [CryptocurrencyJobsService],
})
export class CryptocurrencyJobsModule {}
