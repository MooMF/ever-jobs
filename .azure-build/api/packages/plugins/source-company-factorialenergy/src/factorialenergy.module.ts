import { Module } from '@nestjs/common';
import { FactorialEnergyService } from './factorialenergy.service';

@Module({ providers: [FactorialEnergyService], exports: [FactorialEnergyService] })
export class FactorialEnergyModule {}
