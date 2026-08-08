import { Module } from '@nestjs/common';
import { BitwardenService } from './bitwarden.service';

@Module({ providers: [BitwardenService], exports: [BitwardenService] })
export class BitwardenModule {}
