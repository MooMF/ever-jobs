import { Module } from '@nestjs/common';
import { ConvivaService } from './conviva.service';

@Module({ providers: [ConvivaService], exports: [ConvivaService] })
export class ConvivaModule {}
