import { Module } from '@nestjs/common';
import { AllwebleadsService } from './allwebleads.service';

@Module({ providers: [AllwebleadsService], exports: [AllwebleadsService] })
export class AllwebleadsModule {}
