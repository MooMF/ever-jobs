import { Module } from '@nestjs/common';
import { DialpadService } from './dialpad.service';

@Module({ providers: [DialpadService], exports: [DialpadService] })
export class DialpadModule {}
