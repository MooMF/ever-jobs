import { Module } from '@nestjs/common';
import { MillService } from './mill.service';

@Module({ providers: [MillService], exports: [MillService] })
export class MillModule {}
