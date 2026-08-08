import { Module } from '@nestjs/common';
import { ComplyAdvantageService } from './complyadvantage.service';

@Module({ providers: [ComplyAdvantageService], exports: [ComplyAdvantageService] })
export class ComplyAdvantageModule {}
