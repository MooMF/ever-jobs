import { Module } from '@nestjs/common';
import { AlbedoService } from './albedo.service';

@Module({ providers: [AlbedoService], exports: [AlbedoService] })
export class AlbedoModule {}
