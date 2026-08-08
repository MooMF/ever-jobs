import { Module } from '@nestjs/common';
import { DiligentroboticsService } from './diligentrobotics.service';

@Module({ providers: [DiligentroboticsService], exports: [DiligentroboticsService] })
export class DiligentroboticsModule {}
