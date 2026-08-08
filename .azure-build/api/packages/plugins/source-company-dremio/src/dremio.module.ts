import { Module } from '@nestjs/common';
import { DremioService } from './dremio.service';

@Module({ providers: [DremioService], exports: [DremioService] })
export class DremioModule {}
