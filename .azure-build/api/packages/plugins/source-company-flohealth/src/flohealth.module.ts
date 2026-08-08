import { Module } from '@nestjs/common';
import { FloHealthService } from './flohealth.service';

@Module({ providers: [FloHealthService], exports: [FloHealthService] })
export class FloHealthModule {}
