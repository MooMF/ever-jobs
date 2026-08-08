import { Module } from '@nestjs/common';
import { SalesloftService } from './salesloft.service';

@Module({ providers: [SalesloftService], exports: [SalesloftService] })
export class SalesloftModule {}
