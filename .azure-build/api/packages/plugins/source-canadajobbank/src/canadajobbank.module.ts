import { Module } from '@nestjs/common';
import { CanadaJobBankService } from './canadajobbank.service';

@Module({
  providers: [CanadaJobBankService],
  exports: [CanadaJobBankService],
})
export class CanadaJobBankModule {}
