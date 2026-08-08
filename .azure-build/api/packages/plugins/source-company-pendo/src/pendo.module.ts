import { Module } from '@nestjs/common';
import { PendoService } from './pendo.service';

@Module({ providers: [PendoService], exports: [PendoService] })
export class PendoModule {}
