import { Module } from '@nestjs/common';
import { SpireGlobalService } from './spire.service';

@Module({ providers: [SpireGlobalService], exports: [SpireGlobalService] })
export class SpireGlobalModule {}
