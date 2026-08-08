import { Module } from '@nestjs/common';
import { CryptoJobsListService } from './cryptojobslist.service';

@Module({
  providers: [CryptoJobsListService],
  exports: [CryptoJobsListService],
})
export class CryptoJobsListModule {}
