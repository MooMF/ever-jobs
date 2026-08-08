import { Module } from '@nestjs/common';
import { AmcaService } from './amca.service';

@Module({ providers: [AmcaService], exports: [AmcaService] })
export class AmcaModule {}
