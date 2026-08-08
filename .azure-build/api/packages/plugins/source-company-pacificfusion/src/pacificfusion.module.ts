import { Module } from '@nestjs/common';
import { PacificfusionService } from './pacificfusion.service';

@Module({ providers: [PacificfusionService], exports: [PacificfusionService] })
export class PacificfusionModule {}
