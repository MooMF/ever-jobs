import { Module } from '@nestjs/common';
import { PagerdutyService } from './pagerduty.service';

@Module({ providers: [PagerdutyService], exports: [PagerdutyService] })
export class PagerdutyModule {}
