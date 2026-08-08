import { Module } from '@nestjs/common';
import { ModernHealthService } from './modernhealth.service';

@Module({ providers: [ModernHealthService], exports: [ModernHealthService] })
export class ModernHealthModule {}
