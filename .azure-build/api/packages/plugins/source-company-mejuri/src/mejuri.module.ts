import { Module } from '@nestjs/common';
import { MejuriService } from './mejuri.service';

@Module({ providers: [MejuriService], exports: [MejuriService] })
export class MejuriModule {}
