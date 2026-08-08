import { Module } from '@nestjs/common';
import { FastlyService } from './fastly.service';

@Module({ providers: [FastlyService], exports: [FastlyService] })
export class FastlyModule {}
