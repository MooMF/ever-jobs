import { Module } from '@nestjs/common';
import { AntoraService } from './antora.service';

@Module({ providers: [AntoraService], exports: [AntoraService] })
export class AntoraModule {}
