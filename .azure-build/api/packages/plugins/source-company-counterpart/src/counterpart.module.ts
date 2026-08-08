import { Module } from '@nestjs/common';
import { CounterpartService } from './counterpart.service';

@Module({ providers: [CounterpartService], exports: [CounterpartService] })
export class CounterpartModule {}
