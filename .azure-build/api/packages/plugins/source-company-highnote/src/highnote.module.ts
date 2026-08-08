import { Module } from '@nestjs/common';
import { HighnoteService } from './highnote.service';

@Module({ providers: [HighnoteService], exports: [HighnoteService] })
export class HighnoteModule {}
