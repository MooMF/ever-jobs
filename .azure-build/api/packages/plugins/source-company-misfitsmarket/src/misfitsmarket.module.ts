import { Module } from '@nestjs/common';
import { MisfitsMarketService } from './misfitsmarket.service';

@Module({ providers: [MisfitsMarketService], exports: [MisfitsMarketService] })
export class MisfitsMarketModule {}
