import { Module } from '@nestjs/common';
import { MercuryService } from './mercury.service';

@Module({ providers: [MercuryService], exports: [MercuryService] })
export class MercuryModule {}
