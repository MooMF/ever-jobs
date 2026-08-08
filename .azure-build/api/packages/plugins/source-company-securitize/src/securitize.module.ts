import { Module } from '@nestjs/common';
import { SecuritizeService } from './securitize.service';

@Module({ providers: [SecuritizeService], exports: [SecuritizeService] })
export class SecuritizeModule {}
