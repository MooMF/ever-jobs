import { Module } from '@nestjs/common';
import { InflectionaiService } from './inflectionai.service';

@Module({ providers: [InflectionaiService], exports: [InflectionaiService] })
export class InflectionaiModule {}
