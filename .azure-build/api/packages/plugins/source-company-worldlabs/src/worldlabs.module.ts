import { Module } from '@nestjs/common';
import { WorldLabsService } from './worldlabs.service';

@Module({ providers: [WorldLabsService], exports: [WorldLabsService] })
export class WorldLabsModule {}
