import { Module } from '@nestjs/common';
import { SaatvaService } from './saatva.service';

@Module({ providers: [SaatvaService], exports: [SaatvaService] })
export class SaatvaModule {}
