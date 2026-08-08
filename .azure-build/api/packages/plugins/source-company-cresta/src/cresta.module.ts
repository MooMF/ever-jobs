import { Module } from '@nestjs/common';
import { CrestaService } from './cresta.service';

@Module({ providers: [CrestaService], exports: [CrestaService] })
export class CrestaModule {}
