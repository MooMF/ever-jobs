import { Module } from '@nestjs/common';
import { NayyaService } from './nayya.service';

@Module({ providers: [NayyaService], exports: [NayyaService] })
export class NayyaModule {}
