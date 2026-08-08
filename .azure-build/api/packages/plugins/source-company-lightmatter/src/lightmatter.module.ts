import { Module } from '@nestjs/common';
import { LightmatterService } from './lightmatter.service';

@Module({ providers: [LightmatterService], exports: [LightmatterService] })
export class LightmatterModule {}
