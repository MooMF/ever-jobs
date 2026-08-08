import { Module } from '@nestjs/common';
import { CleoAIService } from './cleo.service';

@Module({ providers: [CleoAIService], exports: [CleoAIService] })
export class CleoAIModule {}
