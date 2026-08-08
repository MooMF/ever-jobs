import { Module } from '@nestjs/common';
import { CalendlyService } from './calendly.service';

@Module({ providers: [CalendlyService], exports: [CalendlyService] })
export class CalendlyModule {}
