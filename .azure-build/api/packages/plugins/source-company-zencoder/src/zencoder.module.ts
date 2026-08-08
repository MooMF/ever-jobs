import { Module } from '@nestjs/common';
import { ZencoderService } from './zencoder.service';

@Module({ providers: [ZencoderService], exports: [ZencoderService] })
export class ZencoderModule {}
