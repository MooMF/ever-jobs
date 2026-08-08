import { Module } from '@nestjs/common';
import { SelfFinancialService } from './selffinancial.service';

@Module({ providers: [SelfFinancialService], exports: [SelfFinancialService] })
export class SelfFinancialModule {}
