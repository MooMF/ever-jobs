import { Module } from '@nestjs/common';
import { ThoropassService } from './thoropass.service';

@Module({ providers: [ThoropassService], exports: [ThoropassService] })
export class ThoropassModule {}
