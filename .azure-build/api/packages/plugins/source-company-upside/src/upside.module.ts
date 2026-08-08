import { Module } from '@nestjs/common';
import { UpsideService } from './upside.service';

@Module({ providers: [UpsideService], exports: [UpsideService] })
export class UpsideModule {}
