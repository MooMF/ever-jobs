import { Module } from '@nestjs/common';
import { SpeechmaticsService } from './speechmatics.service';

@Module({ providers: [SpeechmaticsService], exports: [SpeechmaticsService] })
export class SpeechmaticsModule {}
