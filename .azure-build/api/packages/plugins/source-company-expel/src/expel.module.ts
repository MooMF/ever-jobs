import { Module } from '@nestjs/common';
import { ExpelService } from './expel.service';

@Module({ providers: [ExpelService], exports: [ExpelService] })
export class ExpelModule {}
