import { Module } from '@nestjs/common';
import { EpirusService } from './epirus.service';

@Module({ providers: [EpirusService], exports: [EpirusService] })
export class EpirusModule {}
