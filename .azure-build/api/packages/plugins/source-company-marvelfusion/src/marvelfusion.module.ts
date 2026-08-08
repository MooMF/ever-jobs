import { Module } from '@nestjs/common';
import { MarvelfusionService } from './marvelfusion.service';

@Module({ providers: [MarvelfusionService], exports: [MarvelfusionService] })
export class MarvelfusionModule {}
