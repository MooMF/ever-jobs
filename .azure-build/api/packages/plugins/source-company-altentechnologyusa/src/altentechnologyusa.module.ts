import { Module } from '@nestjs/common';
import { AltentechnologyusaService } from './altentechnologyusa.service';

@Module({ providers: [AltentechnologyusaService], exports: [AltentechnologyusaService] })
export class AltentechnologyusaModule {}
