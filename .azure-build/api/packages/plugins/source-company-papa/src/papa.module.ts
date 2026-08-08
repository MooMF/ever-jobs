import { Module } from '@nestjs/common';
import { PapaService } from './papa.service';

@Module({ providers: [PapaService], exports: [PapaService] })
export class PapaModule {}
