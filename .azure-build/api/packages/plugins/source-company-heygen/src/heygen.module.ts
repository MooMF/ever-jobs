import { Module } from '@nestjs/common';
import { HeygenService } from './heygen.service';

@Module({ providers: [HeygenService], exports: [HeygenService] })
export class HeygenModule {}
