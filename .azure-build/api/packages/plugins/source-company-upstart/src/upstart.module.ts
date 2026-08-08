import { Module } from '@nestjs/common';
import { UpstartService } from './upstart.service';

@Module({ providers: [UpstartService], exports: [UpstartService] })
export class UpstartModule {}
