import { Module } from '@nestjs/common';
import { SoFiService } from './sofi.service';

@Module({ providers: [SoFiService], exports: [SoFiService] })
export class SoFiModule {}
