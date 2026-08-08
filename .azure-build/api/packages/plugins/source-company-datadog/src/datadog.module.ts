import { Module } from '@nestjs/common';
import { DatadogService } from './datadog.service';

@Module({ providers: [DatadogService], exports: [DatadogService] })
export class DatadogModule {}
