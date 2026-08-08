import { Module } from '@nestjs/common';
import { GhostService } from './ghost.service';

@Module({ providers: [GhostService], exports: [GhostService] })
export class GhostModule {}
