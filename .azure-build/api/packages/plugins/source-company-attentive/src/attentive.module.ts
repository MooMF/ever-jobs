import { Module } from '@nestjs/common';
import { AttentiveService } from './attentive.service';

@Module({ providers: [AttentiveService], exports: [AttentiveService] })
export class AttentiveModule {}
