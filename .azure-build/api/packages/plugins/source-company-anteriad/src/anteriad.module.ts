import { Module } from '@nestjs/common';
import { AnteriadService } from './anteriad.service';

@Module({ providers: [AnteriadService], exports: [AnteriadService] })
export class AnteriadModule {}
