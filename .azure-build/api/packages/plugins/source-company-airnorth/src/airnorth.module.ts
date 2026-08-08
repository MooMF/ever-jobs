import { Module } from '@nestjs/common';
import { AirnorthService } from './airnorth.service';

@Module({ providers: [AirnorthService], exports: [AirnorthService] })
export class AirnorthModule {}
