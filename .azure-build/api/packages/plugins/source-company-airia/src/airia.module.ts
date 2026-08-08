import { Module } from '@nestjs/common';
import { AiriaService } from './airia.service';

@Module({ providers: [AiriaService], exports: [AiriaService] })
export class AiriaModule {}
