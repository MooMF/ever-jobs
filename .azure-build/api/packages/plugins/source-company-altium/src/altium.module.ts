import { Module } from '@nestjs/common';
import { AltiumService } from './altium.service';

@Module({ providers: [AltiumService], exports: [AltiumService] })
export class AltiumModule {}
