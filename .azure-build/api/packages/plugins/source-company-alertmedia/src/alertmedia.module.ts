import { Module } from '@nestjs/common';
import { AlertmediaService } from './alertmedia.service';

@Module({ providers: [AlertmediaService], exports: [AlertmediaService] })
export class AlertmediaModule {}
