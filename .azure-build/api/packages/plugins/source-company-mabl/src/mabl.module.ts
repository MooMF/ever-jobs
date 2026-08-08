import { Module } from '@nestjs/common';
import { MablService } from './mabl.service';

@Module({ providers: [MablService], exports: [MablService] })
export class MablModule {}
