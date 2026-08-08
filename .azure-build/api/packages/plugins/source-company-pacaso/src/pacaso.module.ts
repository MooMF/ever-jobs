import { Module } from '@nestjs/common';
import { PacasoService } from './pacaso.service';

@Module({ providers: [PacasoService], exports: [PacasoService] })
export class PacasoModule {}
