import { Module } from '@nestjs/common';
import { SeedHealthService } from './seed.service';

@Module({ providers: [SeedHealthService], exports: [SeedHealthService] })
export class SeedHealthModule {}
