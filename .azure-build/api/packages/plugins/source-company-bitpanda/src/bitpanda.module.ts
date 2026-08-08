import { Module } from '@nestjs/common';
import { BitpandaService } from './bitpanda.service';

@Module({ providers: [BitpandaService], exports: [BitpandaService] })
export class BitpandaModule {}
