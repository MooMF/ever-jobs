import { Module } from '@nestjs/common';
import { FutureFitnessService } from './future.service';

@Module({ providers: [FutureFitnessService], exports: [FutureFitnessService] })
export class FutureFitnessModule {}
