import { Module } from '@nestjs/common';
import { CarrotFertilityService } from './carrotfertility.service';

@Module({ providers: [CarrotFertilityService], exports: [CarrotFertilityService] })
export class CarrotFertilityModule {}
