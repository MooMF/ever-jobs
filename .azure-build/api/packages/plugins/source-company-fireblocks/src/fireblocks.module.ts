import { Module } from '@nestjs/common';
import { FireblocksService } from './fireblocks.service';

@Module({ providers: [FireblocksService], exports: [FireblocksService] })
export class FireblocksModule {}
