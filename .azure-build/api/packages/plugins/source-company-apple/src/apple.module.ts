import { Module } from '@nestjs/common';
import { AppleService } from './apple.service';

@Module({ providers: [AppleService], exports: [AppleService] })
export class AppleModule {}
