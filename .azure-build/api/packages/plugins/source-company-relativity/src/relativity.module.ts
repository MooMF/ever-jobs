import { Module } from '@nestjs/common';
import { RelativityService } from './relativity.service';

@Module({ providers: [RelativityService], exports: [RelativityService] })
export class RelativityModule {}
