import { Module } from '@nestjs/common';
import { AkuityService } from './akuity.service';

@Module({ providers: [AkuityService], exports: [AkuityService] })
export class AkuityModule {}
