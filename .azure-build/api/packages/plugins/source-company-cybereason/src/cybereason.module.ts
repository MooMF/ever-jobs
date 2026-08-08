import { Module } from '@nestjs/common';
import { CybereasonService } from './cybereason.service';

@Module({ providers: [CybereasonService], exports: [CybereasonService] })
export class CybereasonModule {}
