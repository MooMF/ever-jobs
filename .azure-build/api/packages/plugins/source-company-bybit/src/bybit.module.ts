import { Module } from '@nestjs/common';
import { BybitService } from './bybit.service';

@Module({ providers: [BybitService], exports: [BybitService] })
export class BybitModule {}
