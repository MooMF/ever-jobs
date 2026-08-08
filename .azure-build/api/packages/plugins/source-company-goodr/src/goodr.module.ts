import { Module } from '@nestjs/common';
import { GoodrService } from './goodr.service';

@Module({ providers: [GoodrService], exports: [GoodrService] })
export class GoodrModule {}
