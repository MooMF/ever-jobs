import { Module } from '@nestjs/common';
import { TaxbitService } from './taxbit.service';

@Module({ providers: [TaxbitService], exports: [TaxbitService] })
export class TaxbitModule {}
