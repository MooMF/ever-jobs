import { Module } from '@nestjs/common';
import { AlignService } from './align.service';

@Module({ providers: [AlignService], exports: [AlignService] })
export class AlignModule {}
