import { Module } from '@nestjs/common';
import { CurrentService } from './current.service';

@Module({ providers: [CurrentService], exports: [CurrentService] })
export class CurrentModule {}
