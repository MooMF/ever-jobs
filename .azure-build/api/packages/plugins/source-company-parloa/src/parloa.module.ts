import { Module } from '@nestjs/common';
import { ParloaService } from './parloa.service';

@Module({ providers: [ParloaService], exports: [ParloaService] })
export class ParloaModule {}
