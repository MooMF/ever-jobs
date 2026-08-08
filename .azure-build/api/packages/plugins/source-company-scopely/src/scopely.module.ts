import { Module } from '@nestjs/common';
import { ScopelyService } from './scopely.service';

@Module({ providers: [ScopelyService], exports: [ScopelyService] })
export class ScopelyModule {}
