import { Module } from '@nestjs/common';
import { GymsharkService } from './gymshark.service';

@Module({ providers: [GymsharkService], exports: [GymsharkService] })
export class GymsharkModule {}
