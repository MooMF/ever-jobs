import { Module } from '@nestjs/common';
import { CamusEnergyService } from './camusenergy.service';

@Module({ providers: [CamusEnergyService], exports: [CamusEnergyService] })
export class CamusEnergyModule {}
