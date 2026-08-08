import { Module } from '@nestjs/common';
import { SidecarHealthService } from './sidecarhealth.service';

@Module({ providers: [SidecarHealthService], exports: [SidecarHealthService] })
export class SidecarHealthModule {}
