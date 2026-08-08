import { Module } from '@nestjs/common';
import { VerkadaService } from './verkada.service';

@Module({ providers: [VerkadaService], exports: [VerkadaService] })
export class VerkadaModule {}
