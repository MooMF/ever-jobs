import { Module } from '@nestjs/common';
import { NuroService } from './nuro.service';

@Module({ providers: [NuroService], exports: [NuroService] })
export class NuroModule {}
