import { Module } from '@nestjs/common';
import { CarbonService } from './carbon.service';

@Module({ providers: [CarbonService], exports: [CarbonService] })
export class CarbonModule {}
