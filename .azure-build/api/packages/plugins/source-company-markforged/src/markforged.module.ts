import { Module } from '@nestjs/common';
import { MarkforgedService } from './markforged.service';

@Module({ providers: [MarkforgedService], exports: [MarkforgedService] })
export class MarkforgedModule {}
