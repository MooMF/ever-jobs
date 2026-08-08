import { Module } from '@nestjs/common';
import { AlphagrepsecuritiesService } from './alphagrepsecurities.service';

@Module({ providers: [AlphagrepsecuritiesService], exports: [AlphagrepsecuritiesService] })
export class AlphagrepsecuritiesModule {}
