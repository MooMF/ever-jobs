import { Module } from '@nestjs/common';
import { RondoEnergyService } from './rondoenergy.service';

@Module({ providers: [RondoEnergyService], exports: [RondoEnergyService] })
export class RondoEnergyModule {}
