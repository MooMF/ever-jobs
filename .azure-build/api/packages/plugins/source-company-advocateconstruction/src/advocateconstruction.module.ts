import { Module } from '@nestjs/common';
import { AdvocateconstructionService } from './advocateconstruction.service';

@Module({ providers: [AdvocateconstructionService], exports: [AdvocateconstructionService] })
export class AdvocateconstructionModule {}
