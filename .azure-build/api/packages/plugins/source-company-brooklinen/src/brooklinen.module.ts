import { Module } from '@nestjs/common';
import { BrooklinenService } from './brooklinen.service';

@Module({ providers: [BrooklinenService], exports: [BrooklinenService] })
export class BrooklinenModule {}
