import { Module } from '@nestjs/common';
import { AppdirectService } from './appdirect.service';

@Module({ providers: [AppdirectService], exports: [AppdirectService] })
export class AppdirectModule {}
