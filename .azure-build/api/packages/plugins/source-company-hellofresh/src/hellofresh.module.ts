import { Module } from '@nestjs/common';
import { HelloFreshService } from './hellofresh.service';

@Module({ providers: [HelloFreshService], exports: [HelloFreshService] })
export class HelloFreshModule {}
