import { Module } from '@nestjs/common';
import { OnEnergyService } from './onenergy.service';

@Module({ providers: [OnEnergyService], exports: [OnEnergyService] })
export class OnEnergyModule {}
