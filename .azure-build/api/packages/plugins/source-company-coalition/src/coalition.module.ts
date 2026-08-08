import { Module } from '@nestjs/common';
import { CoalitionService } from './coalition.service';

@Module({ providers: [CoalitionService], exports: [CoalitionService] })
export class CoalitionModule {}
