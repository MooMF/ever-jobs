import { Module } from '@nestjs/common';
import { PlanetScaleService } from './planetscale.service';

@Module({ providers: [PlanetScaleService], exports: [PlanetScaleService] })
export class PlanetScaleModule {}
