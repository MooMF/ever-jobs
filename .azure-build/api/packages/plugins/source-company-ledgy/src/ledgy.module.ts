import { Module } from '@nestjs/common';
import { LedgyService } from './ledgy.service';

@Module({ providers: [LedgyService], exports: [LedgyService] })
export class LedgyModule {}
