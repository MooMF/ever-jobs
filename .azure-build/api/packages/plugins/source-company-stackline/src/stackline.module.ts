import { Module } from '@nestjs/common';
import { StacklineService } from './stackline.service';

@Module({ providers: [StacklineService], exports: [StacklineService] })
export class StacklineModule {}
