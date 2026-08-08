import { Module } from '@nestjs/common';
import { MelioService } from './melio.service';

@Module({ providers: [MelioService], exports: [MelioService] })
export class MelioModule {}
