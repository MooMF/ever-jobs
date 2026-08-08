import { Module } from '@nestjs/common';
import { CollectiveHealthService } from './collectivehealth.service';

@Module({ providers: [CollectiveHealthService], exports: [CollectiveHealthService] })
export class CollectiveHealthModule {}
