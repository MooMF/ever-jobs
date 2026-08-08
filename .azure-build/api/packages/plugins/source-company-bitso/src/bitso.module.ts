import { Module } from '@nestjs/common';
import { BitsoService } from './bitso.service';

@Module({ providers: [BitsoService], exports: [BitsoService] })
export class BitsoModule {}
