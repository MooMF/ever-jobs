import { Module } from '@nestjs/common';
import { SparkfundService } from './sparkfund.service';

@Module({ providers: [SparkfundService], exports: [SparkfundService] })
export class SparkfundModule {}
