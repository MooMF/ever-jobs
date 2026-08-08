import { Module } from '@nestjs/common';
import { ChimeService } from './chime.service';

@Module({ providers: [ChimeService], exports: [ChimeService] })
export class ChimeModule {}
