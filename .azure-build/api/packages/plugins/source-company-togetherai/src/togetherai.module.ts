import { Module } from '@nestjs/common';
import { TogetheraiService } from './togetherai.service';

@Module({ providers: [TogetheraiService], exports: [TogetheraiService] })
export class TogetheraiModule {}
