import { Module } from '@nestjs/common';
import { StackBlitzService } from './stackblitz.service';

@Module({ providers: [StackBlitzService], exports: [StackBlitzService] })
export class StackBlitzModule {}
