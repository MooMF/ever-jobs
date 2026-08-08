import { Module } from '@nestjs/common';
import { AdvancedtechnologyservicesService } from './advancedtechnologyservices.service';

@Module({ providers: [AdvancedtechnologyservicesService], exports: [AdvancedtechnologyservicesService] })
export class AdvancedtechnologyservicesModule {}
