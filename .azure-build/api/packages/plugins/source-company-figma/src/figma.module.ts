import { Module } from '@nestjs/common';
import { FigmaService } from './figma.service';

@Module({ providers: [FigmaService], exports: [FigmaService] })
export class FigmaModule {}
