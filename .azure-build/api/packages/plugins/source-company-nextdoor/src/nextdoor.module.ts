import { Module } from '@nestjs/common';
import { NextdoorService } from './nextdoor.service';

@Module({ providers: [NextdoorService], exports: [NextdoorService] })
export class NextdoorModule {}
