import { Module } from '@nestjs/common';
import { AgodaService } from './agoda.service';

@Module({ providers: [AgodaService], exports: [AgodaService] })
export class AgodaModule {}
