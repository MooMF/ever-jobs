import { Module } from '@nestjs/common';
import { DescopeService } from './descope.service';

@Module({ providers: [DescopeService], exports: [DescopeService] })
export class DescopeModule {}
