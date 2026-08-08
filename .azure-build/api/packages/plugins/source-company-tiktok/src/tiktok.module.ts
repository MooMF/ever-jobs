import { Module } from '@nestjs/common';
import { TikTokService } from './tiktok.service';

@Module({ providers: [TikTokService], exports: [TikTokService] })
export class TikTokModule {}
