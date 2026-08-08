import { Module } from '@nestjs/common';
import { CookunityService } from './cookunity.service';

@Module({ providers: [CookunityService], exports: [CookunityService] })
export class CookunityModule {}
