import { Module } from '@nestjs/common';
import { GalileoService } from './galileo.service';

@Module({ providers: [GalileoService], exports: [GalileoService] })
export class GalileoModule {}
