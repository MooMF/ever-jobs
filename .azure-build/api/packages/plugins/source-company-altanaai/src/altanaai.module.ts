import { Module } from '@nestjs/common';
import { AltanaaiService } from './altanaai.service';

@Module({ providers: [AltanaaiService], exports: [AltanaaiService] })
export class AltanaaiModule {}
