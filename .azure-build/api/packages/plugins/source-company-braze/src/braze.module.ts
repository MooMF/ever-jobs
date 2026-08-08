import { Module } from '@nestjs/common';
import { BrazeService } from './braze.service';

@Module({ providers: [BrazeService], exports: [BrazeService] })
export class BrazeModule {}
