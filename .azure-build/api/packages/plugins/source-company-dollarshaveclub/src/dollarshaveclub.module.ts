import { Module } from '@nestjs/common';
import { DollarShaveClubService } from './dollarshaveclub.service';

@Module({ providers: [DollarShaveClubService], exports: [DollarShaveClubService] })
export class DollarShaveClubModule {}
