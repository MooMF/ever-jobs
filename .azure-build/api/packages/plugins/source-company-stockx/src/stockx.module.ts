import { Module } from '@nestjs/common';
import { StockXService } from './stockx.service';

@Module({ providers: [StockXService], exports: [StockXService] })
export class StockXModule {}
