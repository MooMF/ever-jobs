import { Module } from '@nestjs/common';
import { MarqetaService } from './marqeta.service';

@Module({ providers: [MarqetaService], exports: [MarqetaService] })
export class MarqetaModule {}
