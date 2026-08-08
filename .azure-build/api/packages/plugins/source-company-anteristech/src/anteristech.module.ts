import { Module } from '@nestjs/common';
import { AnteristechService } from './anteristech.service';

@Module({ providers: [AnteristechService], exports: [AnteristechService] })
export class AnteristechModule {}
