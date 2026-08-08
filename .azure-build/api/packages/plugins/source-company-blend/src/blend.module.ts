import { Module } from '@nestjs/common';
import { BlendService } from './blend.service';

@Module({ providers: [BlendService], exports: [BlendService] })
export class BlendModule {}
