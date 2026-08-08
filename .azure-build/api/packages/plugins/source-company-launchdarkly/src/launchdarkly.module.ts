import { Module } from '@nestjs/common';
import { LaunchdarklyService } from './launchdarkly.service';

@Module({ providers: [LaunchdarklyService], exports: [LaunchdarklyService] })
export class LaunchdarklyModule {}
