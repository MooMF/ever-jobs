import { Module } from '@nestjs/common';
import { BitgoService } from './bitgo.service';

@Module({ providers: [BitgoService], exports: [BitgoService] })
export class BitgoModule {}
