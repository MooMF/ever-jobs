import { Module } from '@nestjs/common';
import { AsanaService } from './asana.service';

@Module({ providers: [AsanaService], exports: [AsanaService] })
export class AsanaModule {}
