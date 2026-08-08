import { Module } from '@nestjs/common';
import { PathaiService } from './pathai.service';

@Module({ providers: [PathaiService], exports: [PathaiService] })
export class PathaiModule {}
