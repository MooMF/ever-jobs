import { Module } from '@nestjs/common';
import { FirsthandHealthService } from './firsthand.service';

@Module({ providers: [FirsthandHealthService], exports: [FirsthandHealthService] })
export class FirsthandHealthModule {}
