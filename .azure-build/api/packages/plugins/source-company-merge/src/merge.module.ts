import { Module } from '@nestjs/common';
import { MergeService } from './merge.service';

@Module({ providers: [MergeService], exports: [MergeService] })
export class MergeModule {}
