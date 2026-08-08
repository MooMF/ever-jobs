import { Module } from '@nestjs/common';
import { SliceService } from './slice.service';

@Module({ providers: [SliceService], exports: [SliceService] })
export class SliceModule {}
