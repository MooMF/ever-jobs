import { Module } from '@nestjs/common';
import { NexampService } from './nexamp.service';

@Module({ providers: [NexampService], exports: [NexampService] })
export class NexampModule {}
