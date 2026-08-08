import { Module } from '@nestjs/common';
import { WatershedService } from './watershed.service';

@Module({ providers: [WatershedService], exports: [WatershedService] })
export class WatershedModule {}
