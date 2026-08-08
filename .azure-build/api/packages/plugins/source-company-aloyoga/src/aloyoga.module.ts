import { Module } from '@nestjs/common';
import { AloYogaService } from './aloyoga.service';

@Module({ providers: [AloYogaService], exports: [AloYogaService] })
export class AloYogaModule {}
