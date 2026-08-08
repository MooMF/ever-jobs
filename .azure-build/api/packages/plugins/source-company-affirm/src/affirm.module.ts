import { Module } from '@nestjs/common';
import { AffirmService } from './affirm.service';

@Module({ providers: [AffirmService], exports: [AffirmService] })
export class AffirmModule {}
