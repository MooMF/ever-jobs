import { Module } from '@nestjs/common';
import { AdaptiveBiotechnologiesService } from './adaptivebiotechnologies.service';

@Module({ providers: [AdaptiveBiotechnologiesService], exports: [AdaptiveBiotechnologiesService] })
export class AdaptiveBiotechnologiesModule {}
