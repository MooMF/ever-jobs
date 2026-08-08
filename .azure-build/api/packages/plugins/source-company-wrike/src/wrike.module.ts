import { Module } from '@nestjs/common';
import { WrikeService } from './wrike.service';

@Module({ providers: [WrikeService], exports: [WrikeService] })
export class WrikeModule {}
