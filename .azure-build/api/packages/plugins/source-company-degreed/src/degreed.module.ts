import { Module } from '@nestjs/common';
import { DegreedService } from './degreed.service';

@Module({ providers: [DegreedService], exports: [DegreedService] })
export class DegreedModule {}
