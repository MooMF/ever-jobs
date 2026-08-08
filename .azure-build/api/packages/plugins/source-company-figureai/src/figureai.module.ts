import { Module } from '@nestjs/common';
import { FigureaiService } from './figureai.service';

@Module({ providers: [FigureaiService], exports: [FigureaiService] })
export class FigureaiModule {}
