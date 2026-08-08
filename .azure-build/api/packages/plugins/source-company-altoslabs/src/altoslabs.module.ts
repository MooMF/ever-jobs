import { Module } from '@nestjs/common';
import { AltoslabsService } from './altoslabs.service';

@Module({ providers: [AltoslabsService], exports: [AltoslabsService] })
export class AltoslabsModule {}
