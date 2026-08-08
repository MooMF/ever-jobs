import { Module } from '@nestjs/common';
import { MochiHealthService } from './mochihealth.service';

@Module({ providers: [MochiHealthService], exports: [MochiHealthService] })
export class MochiHealthModule {}
