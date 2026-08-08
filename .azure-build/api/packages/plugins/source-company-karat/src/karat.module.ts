import { Module } from '@nestjs/common';
import { KaratService } from './karat.service';

@Module({ providers: [KaratService], exports: [KaratService] })
export class KaratModule {}
