import { Module } from '@nestjs/common';
import { AssemblyAIService } from './assemblyai.service';

@Module({ providers: [AssemblyAIService], exports: [AssemblyAIService] })
export class AssemblyAIModule {}
