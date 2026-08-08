import { Module } from '@nestjs/common';
import { CelonisService } from './celonis.service';

@Module({ providers: [CelonisService], exports: [CelonisService] })
export class CelonisModule {}
