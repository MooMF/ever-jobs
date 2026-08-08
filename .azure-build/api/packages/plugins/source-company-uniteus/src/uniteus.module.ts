import { Module } from '@nestjs/common';
import { UniteUsService } from './uniteus.service';

@Module({ providers: [UniteUsService], exports: [UniteUsService] })
export class UniteUsModule {}
