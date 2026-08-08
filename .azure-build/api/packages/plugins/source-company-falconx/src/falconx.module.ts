import { Module } from '@nestjs/common';
import { FalconXService } from './falconx.service';

@Module({ providers: [FalconXService], exports: [FalconXService] })
export class FalconXModule {}
