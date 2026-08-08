import { Module } from '@nestjs/common';
import { LatticeService } from './lattice.service';

@Module({ providers: [LatticeService], exports: [LatticeService] })
export class LatticeModule {}
