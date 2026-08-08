import { Module } from '@nestjs/common';
import { FoundersService } from './founders.service';

@Module({ providers: [FoundersService], exports: [FoundersService] })
export class FoundersModule {}
