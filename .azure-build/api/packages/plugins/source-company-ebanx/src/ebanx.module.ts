import { Module } from '@nestjs/common';
import { EBANXService } from './ebanx.service';

@Module({ providers: [EBANXService], exports: [EBANXService] })
export class EBANXModule {}
