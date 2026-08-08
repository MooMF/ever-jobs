import { Module } from '@nestjs/common';
import { NewRelicService } from './newrelic.service';

@Module({ providers: [NewRelicService], exports: [NewRelicService] })
export class NewRelicModule {}
