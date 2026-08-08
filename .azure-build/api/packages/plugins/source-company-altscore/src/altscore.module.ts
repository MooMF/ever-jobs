import { Module } from '@nestjs/common';
import { AltscoreService } from './altscore.service';

@Module({ providers: [AltscoreService], exports: [AltscoreService] })
export class AltscoreModule {}
