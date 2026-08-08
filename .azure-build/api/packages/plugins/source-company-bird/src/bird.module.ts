import { Module } from '@nestjs/common';
import { BirdService } from './bird.service';

@Module({ providers: [BirdService], exports: [BirdService] })
export class BirdModule {}
